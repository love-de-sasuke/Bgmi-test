const axios = require('axios');
const fetch = require('node-fetch');

// Function to fetch proxies from an API
async function fetchProxies() {
    const url = "https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all";
    const response = await fetch(url);
    const proxyText = await response.text();
    return proxyText.split('\n').filter(proxy => proxy.trim());
}

// Function to get a random proxy from the list
function getRandomProxy(proxies) {
    return proxies[Math.floor(Math.random() * proxies.length)];
}

// Function to make a request using a proxy
async function makeRequest(url, proxies) {
    const proxy = getRandomProxy(proxies);
    const proxyUrl = `http://${proxy}`;
    
    try {
        const response = await axios.get(url, {
            proxy: {
                host: proxy.split(':')[0],
                port: proxy.split(':')[1]
            },
            timeout: 10000
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            console.log(`Response error: ${error.response.status} - ${error.response.statusText}`);
        } else if (error.request) {
            console.log(`Request error: ${error.request}`);
        } else {
            console.log(`Error: ${error.message}`);
        }
        return null;
    }
}

// Main function to rotate proxies and make requests
async function main() {
    const proxies = await fetchProxies();
    const url = "https://icanhazip.com/";
    
    for (let i = 0; i < 10; i++) {  // Making 10 requests as an example
        const response = await makeRequest(url, proxies);
        if (response) {
            console.log(`Response: ${response}`);
        } else {
            console.log(`Failed to fetch response on attempt ${i + 1}`);
        }
    }
}

// Run the main function
main();

