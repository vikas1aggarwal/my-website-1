// This file contains the JavaScript code for the website. 
// It handles the dynamic behavior of the web application, such as event listeners and DOM manipulation.

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('myButton');
    const output = document.getElementById('output');

    button.addEventListener('click', () => {
        output.textContent = 'Button was clicked!';
    });
});