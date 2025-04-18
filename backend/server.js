
import express from 'express'
import cors from 'cors';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import tmp from 'tmp';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 7000;

// Middleware
app.use(express.json());
app.use(express.text());
app.use(cors());

const limiter = rateLimit({
    windowMs : 60000,
    max : 15
});

app.use(limiter);

class InternalServerError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}

async function runToadCode(data) {
    const tempFile = tmp.fileSync({postfix: "_inputToad.txt"});
    const filePath = tempFile.name;

    try {
        await fs.writeFile(filePath, data);
        console.log("Written code to temp file:", filePath);

        const process = spawn('java', ['-jar', './toad.jar', filePath]);
        let output = '';

        return new Promise((resolve, reject) => {
            process.stdout.on('data', (data) => {
                output += data.toString();
                console.log("stdout:", data.toString());
            });

            process.stderr.on('data', (data) => {
                output += data.toString();
                console.error("stderr:", data.toString());
            });

            process.on('close', (code) => {
                output += `\nProcess exited with code ${code}`;
                console.log("Process closed with code:", code);
                tempFile.removeCallback(); // Clean up the temporary file
                resolve(output);
            });

            process.on('error', (err) => {
                console.error("Error executing process:", err);
                tempFile.removeCallback();
                resolve(output);
            });
        });
    } catch (err) {
        tempFile.removeCallback();
        throw new InternalServerError("Error running the java process");
    }
}

app.get('/', (req, res) => {
    res.send('Welcome to the Toad interpreter backend! Use POST / to run your code.');
});

app.post('/', async (req, res, next) => {
    try {
        console.log("Request received at backend"); // Debugging
        console.log("Input code:", req.body); 

        const inputCode = req.body;
        if (!inputCode || typeof inputCode !== 'string') {
            return res.status(400).json({ error: 'Invalid input. Please provide valid code as plain text.' });
        }

        const output = await runToadCode(inputCode);
        console.log("Output:", output); 

        res.setHeader('Content-Type', 'text/plain');
        res.status(200).send(output);
    } catch (err) {
        console.error("Error in backend:", err);
        next(err);
    }
});


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({error: err.message || 'unexpected server error.'});
});

app.listen(PORT, ()=>{
    console.log("Server running at port ", PORT);
})