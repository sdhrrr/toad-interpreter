async function sendCode() {
    const input = document.getElementById('codeInput').value;
    const output = document.getElementById('output');
    output.textContent = "Running the code...";


    try {
        // const response = await fetch('https://otlapi.azurewebsites.net/', {
        const response = await fetch('http://localhost:7000/', {
            method: 'POST',
            headers: {'Content-Type' : 'text/plain'},
            body: input
        });

        if (!response.ok) {
            const error = await response.json();
            output.textContent = `Error: ${error.error || 'Unexpected error'}`;
        } else {
            const responseText = await response.text();
            output.textContent = responseText;
        }
    } catch (err) {
        output.textContent = `Error: ${err.message}`;
    }
}

document.getElementById('btn').addEventListener('click', sendCode);

// theme toggling
document.addEventListener("keydown", (event)=>{
    if(event.ctrlKey && event.key=="Enter") sendCode();
})

const themeToggle = document.getElementById("themeToggle");
const htmlElement = document.documentElement;

if (!htmlElement.hasAttribute("data-theme")) {
    htmlElement.setAttribute("data-theme", "dark");
}

const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
    htmlElement.setAttribute("data-theme", savedTheme);
}

themeToggle.addEventListener("click", () => {
    const currentTheme = htmlElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    htmlElement.setAttribute("data-theme", newTheme);

    localStorage.setItem("theme", newTheme);
});
