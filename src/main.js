class EaseQR {
  constructor() {
    this.container = document.getElementById("container");
    this.textInput = document.getElementById("textInput");
    this.fileInput = document.getElementById("fileInput");
    this.qrCodeDiv = document.getElementById("qrcode");
    this.fileDescription = document.getElementById("fileDescription");
    this.typeSize = document.getElementById("typeSize");
    this.fileName = document.getElementById("fileName");
    this.defaultUrl = "https://github.com/vxncius-dev";
    this.deleteButton = document.getElementById("delete");
    this.debugMode = false;

    this.initialize();
  }

  initialize() {
    document.body.addEventListener("paste", (event) => this.handlePaste(event));
    document.body.addEventListener("dragover", (event) => event.preventDefault());
    document.body.addEventListener("drop", (event) => this.handleDrop(event));

    this.deleteButton.addEventListener("click", () => this.clearInputs());
    this.textInput.addEventListener("input", () => this.generateQRCode(this.textInput.value || this.defaultUrl));
    this.fileInput.addEventListener("change", (event) => this.handleFileChange(event));

    this.generateQRCode(this.defaultUrl);
  }

  handlePaste(event) {
    const items = (event.clipboardData || window.clipboardData).items;
    this.handleItems(items);
  }

  handleDrop(event) {
    event.preventDefault();
    const items = event.dataTransfer.items;
    this.handleItems(items);
  }

  handleItems(items) {
    for (const item of items) {
      if (item.kind === "string") {
        item.getAsString((text) => this.generateQRCode(text));
      } else if (item.kind === "file") {
        const file = item.getAsFile();
        this.processFile(file);
      }
    }
  }

  async processFile(file) {
    if (!file) return;

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 100) {
      alert("O arquivo excede o limite de 100 MB.");
      this.fileInput.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        this.updateFileDescription(file, reader.result);
      };
      reader.readAsDataURL(file);

      if (this.debugMode) return;

      const response = await fetch("https://tmpfiles.org/api/v1/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.status === "success") {
        let url = data.data.url.replace("https://tmpfiles.org", "https://tmpfiles.org/dl");
        this.generateQRCode(url);
        this.textInput.value = url;
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      alert("Erro ao fazer upload do arquivo");
    }
  }

  updateFileDescription(file, fileData) {
    const imageElement = this.fileDescription.querySelector("img");
    const isImage = file.type.startsWith("image/");
    imageElement.src = isImage
      ? fileData
      : "https://www.geoinformatics.upol.cz/novy/wp-content/uploads/2024/02/istockphoto-1147544807-612x612-1.jpg";

    const fileSizeInKB = (file.size / 1024).toFixed(2);
    const fileType = file.type.split("/")[1].toUpperCase();
    const fileNameValue = file.name;

    imageElement.alt = file.name;
    this.fileName.title = file.name;
    this.typeSize.textContent = `${fileType}, ${fileSizeInKB} KB`;
    this.fileName.textContent = fileNameValue;

    this.showFileDescription();
  }

  showFileDescription() {
    this.fileDescription.style.display = "flex";
    setTimeout(() => {
      this.fileDescription.style.position = "relative";
      this.fileDescription.style.transform = "translateY(0)";
      this.fileDescription.style.opacity = "1";
    }, 250);
  }

  clearInputs() {
    this.textInput.value = "";
    this.typeSize.textContent = "";
    this.fileName.textContent = "";
    this.fileDescription.style.opacity = "0";
    setTimeout(() => {
      this.fileDescription.style.display = "none";
    }, 250);
    this.fileInput.value = "";
    this.generateQRCode(this.defaultUrl);
  }

  generateQRCode(value) {
    this.qrCodeDiv.innerHTML = "";
    new QRCode(this.qrCodeDiv, {
      text: value,
      width: 180,
      height: 180,
      colorDark: "#000",
      colorLight: "#00000000",
      correctLevel: QRCode.CorrectLevel.H,
    });
    this.qrCodeDiv.querySelector("img").setAttribute("draggable", false);
  }

  async handleFileChange() {
    const file = this.fileInput.files[0];
    if (file) await this.processFile(file);
  }
}

new EaseQR();
