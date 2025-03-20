const container = document.getElementById("container"),
	textInput = document.getElementById("textInput"),
	fileInput = document.getElementById("fileInput"),
	qrCodeDiv = document.getElementById("qrcode"),
	fileDescription = document.getElementById("fileDescription"),
	typeSize = document.getElementById("typeSize"),
	fileName = document.getElementById("fileName"),
	defaultUrl = "https://github.com/vxncius-dev",
	deleteButton = document.getElementById("delete"),
	debugMode = false;

document.body.addEventListener("paste", (event) => {
	const items = (event.clipboardData || window.clipboardData).items;
	handleItems(items);
});

document.body.addEventListener("dragover", (event) => {
	event.preventDefault();
});

document.body.addEventListener("drop", (event) => {
	event.preventDefault();
	const items = event.dataTransfer.items;
	handleItems(items);
});

const handleItems = (items) => {
	for (const item of items) {
		if (item.kind === "string" && item.type === "text/html") {
			item.getAsString((html) => {
				const match = html.match(/<img.*?src=["'](.*?)["']/);
				if (match) {
					const imageUrl = match[1];
					generateQRCode(imageUrl);
				}
			});
		} else if (item.kind === "string" && item.type === "text/plain") {
			item.getAsString((text) => {
				generateQRCode(text);
			});
		} else if (item.kind === "file") {
			const file = item.getAsFile();
			processFile(file);
		}
	}
};

deleteButton.addEventListener("click", () => {
	textInput.value = "";
	typeSize.textContent = "";
	fileName.textContent = "";
	fileDescription.style.opacity = "0";
	setTimeout(() => {
		fileDescription.style.display = "none";
	}, 250);
	fileInput.value = "";
	generateQRCode(defaultUrl);
});

const generateQRCode = (value) => {
	qrCodeDiv.innerHTML = "";
	new QRCode(qrCodeDiv, {
		text: value,
		width: 180,
		height: 180,
		colorDark: "#000",
		colorLight: "#00000000",
		correctLevel: QRCode.CorrectLevel.H
	});
	qrCodeDiv.querySelector("img").setAttribute("draggable", false);
};

textInput.addEventListener("input", () =>
	generateQRCode(textInput.value || defaultUrl)
);

const processFile = async (file) => {
	if (!file) return;

	const fileSizeMB = file.size / (1024 * 1024);
	if (fileSizeMB > 100) {
		alert("O arquivo excede o limite de 100 MB.");
		fileInput.value = "";
		return;
	}

	const formData = new FormData();
	formData.append("file", file);

	try {
		const reader = new FileReader();
		reader.onloadend = () => {
			const imageElement = fileDescription.querySelector("img");
			const isImage = file.type.startsWith("image/");
			imageElement.src = isImage
				? reader.result
				: "https://www.geoinformatics.upol.cz/novy/wp-content/uploads/2024/02/istockphoto-1147544807-612x612-1.jpg";
			const fileSizeInKB = (file.size / 1024).toFixed(2);
			const fileType = file.type.split("/")[1].toUpperCase();
			const fileNameValue = file.name;
			isImage.alt = file.name;
			fileName.title = file.name;
			typeSize.textContent = `${fileType}, ${fileSizeInKB} KB`;
			fileName.textContent = fileNameValue;
			fileDescription.style.display = "flex";
			setTimeout(() => {
				fileDescription.style.position = "relative";
				fileDescription.style.transform = " translateY(0)";
				fileDescription.style.opacity = "1";
			}, 250);
		};

		reader.readAsDataURL(file);
		if (debugMode) return;
		const response = await fetch("https://tmpfiles.org/api/v1/upload", {
			method: "POST",
			body: formData
		});

		const data = await response.json();

		if (data.status === "success") {
			let url = data.data.url;
			url = url.replace("https://tmpfiles.org", "https://tmpfiles.org/dl");
			generateQRCode(url);
			textInput.value = url;
		}
	} catch (error) {
		console.error("Erro no upload:", error);
		alert("Erro ao fazer upload do arquivo");
	}
};

fileInput.addEventListener("change", async () => {
	const file = fileInput.files[0];
	if (file) await processFile(file);
});

generateQRCode(defaultUrl);
