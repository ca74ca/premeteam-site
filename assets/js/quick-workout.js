(function () {
  var ENDPOINT_URL = "https://www.varacis.com/api/quick-workout";
  var MAX_FILE_BYTES = 10 * 1024 * 1024;
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var form = document.getElementById("quickWorkoutForm");
  var emailInput = document.getElementById("emailInput");
  var imageInput = document.getElementById("imageInput");
  var uploadZone = document.getElementById("uploadZone");
  var previewWrap = document.getElementById("previewWrap");
  var previewImage = document.getElementById("previewImage");
  var submitBtn = document.getElementById("submitBtn");
  var statusLine = document.getElementById("statusLine");
  var workoutOutput = document.getElementById("workoutOutput");
  var copyBtn = document.getElementById("copyBtn");

  var selectedImageBase64 = "";
  var selectedImageDataUrl = "";

  if (!form || !emailInput || !imageInput || !uploadZone || !previewWrap || !previewImage || !submitBtn || !statusLine || !workoutOutput || !copyBtn) {
    return;
  }

  function setStatus(message, tone) {
    statusLine.textContent = message || "";
    statusLine.classList.remove("ok", "warn", "bad");
    if (tone) {
      statusLine.classList.add(tone);
    }
  }

  function setWorkoutOutput(text) {
    workoutOutput.textContent = text;
    copyBtn.disabled = !text || text === "Your generated workout will appear here.";
  }

  function normalizeBase64(dataUrl) {
    var marker = ";base64,";
    var markerIndex = dataUrl.indexOf(marker);
    if (markerIndex === -1) return "";
    return dataUrl.slice(markerIndex + marker.length);
  }

  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve(String(reader.result || ""));
      };
      reader.onerror = function () {
        reject(new Error("Could not read the selected image."));
      };
      reader.readAsDataURL(file);
    });
  }

  async function loadImageFile(file) {
    if (!file) {
      throw new Error("Please select an image before submitting.");
    }

    if (!file.type || file.type.indexOf("image/") !== 0) {
      throw new Error("Only image files are supported.");
    }

    if (file.size > MAX_FILE_BYTES) {
      throw new Error("Image is too large. Please use an image under 10MB.");
    }

    var dataUrl = await fileToDataUrl(file);
    var base64 = normalizeBase64(dataUrl);

    if (!base64) {
      throw new Error("Could not process the image as base64.");
    }

    selectedImageBase64 = base64;
    selectedImageDataUrl = dataUrl;
    previewImage.src = dataUrl;
    previewWrap.classList.add("visible");
    setStatus("Image loaded. Ready to generate your workout.", "ok");
  }

  function validateEmail(email) {
    return EMAIL_PATTERN.test(String(email || "").trim());
  }

  function parseWorkoutTextFromJson(payload) {
    if (!payload || typeof payload !== "object") return "";
    if (typeof payload.workout === "string" && payload.workout.trim()) return payload.workout.trim();
    if (typeof payload.text === "string" && payload.text.trim()) return payload.text.trim();
    if (typeof payload.output === "string" && payload.output.trim()) return payload.output.trim();
    return "";
  }

  async function extractResponseText(response) {
    var contentType = String(response.headers.get("content-type") || "").toLowerCase();

    if (contentType.indexOf("application/json") !== -1) {
      var data = await response.json();
      var maybeWorkout = parseWorkoutTextFromJson(data);
      if (maybeWorkout) return maybeWorkout;
      return JSON.stringify(data, null, 2);
    }

    var text = await response.text();
    return text.trim() || "";
  }

  async function submitQuickWorkout(event) {
    event.preventDefault();

    var email = String(emailInput.value || "").trim();

    if (!validateEmail(email)) {
      setStatus("Enter a valid email address.", "bad");
      return;
    }

    if (!selectedImageBase64) {
      setStatus("Upload an image before generating a workout.", "bad");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Generating...";
    copyBtn.disabled = true;
    setStatus("Submitting image and email to Varacis...", "warn");

    try {
      var response = await fetch(ENDPOINT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/plain, application/json"
        },
        body: JSON.stringify({
          imageBase64: selectedImageBase64,
          email: email
        })
      });

      var responseText = await extractResponseText(response);

      if (!response.ok) {
        throw new Error(responseText || "Request failed. Please try again.");
      }

      if (!responseText) {
        throw new Error("No workout text was returned by the endpoint.");
      }

      setWorkoutOutput(responseText);
      setStatus("Workout generated successfully.", "ok");
    } catch (error) {
      var message = error && error.message ? error.message : "Request failed. Please try again.";
      setStatus(message, "bad");
      setWorkoutOutput("Your generated workout will appear here.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Generate Workout";
    }
  }

  function openPicker() {
    imageInput.click();
  }

  function onDrop(event) {
    event.preventDefault();
    uploadZone.classList.remove("drag-over");

    var file = event.dataTransfer && event.dataTransfer.files ? event.dataTransfer.files[0] : null;
    if (!file) return;

    loadImageFile(file).catch(function (error) {
      setStatus(error.message || "Failed to read the dropped image.", "bad");
    });
  }

  uploadZone.addEventListener("click", openPicker);
  uploadZone.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  });

  uploadZone.addEventListener("dragover", function (event) {
    event.preventDefault();
    uploadZone.classList.add("drag-over");
  });

  uploadZone.addEventListener("dragleave", function () {
    uploadZone.classList.remove("drag-over");
  });

  uploadZone.addEventListener("drop", onDrop);

  imageInput.addEventListener("change", function (event) {
    var file = event.target && event.target.files ? event.target.files[0] : null;

    loadImageFile(file).catch(function (error) {
      setStatus(error.message || "Could not read that image.", "bad");
    });
  });

  form.addEventListener("submit", submitQuickWorkout);

  copyBtn.addEventListener("click", async function () {
    var text = String(workoutOutput.textContent || "").trim();

    if (!text || text === "Your generated workout will appear here.") {
      setStatus("Generate a workout before copying.", "warn");
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setStatus("Workout copied to clipboard.", "ok");
    } catch (error) {
      setStatus("Clipboard copy failed. You can manually copy the text.", "bad");
    }
  });

  if (selectedImageDataUrl) {
    previewImage.src = selectedImageDataUrl;
  }
})();
