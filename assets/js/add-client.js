(function () {
  var ENDPOINT_URL = "https://www.varacis.com/api/client-intake";
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var form = document.getElementById("clientIntakeForm");
  var nameInput = document.getElementById("nameInput");
  var emailInput = document.getElementById("emailInput");
  var wearableInput = document.getElementById("wearableInput");
  var submitBtn = document.getElementById("submitBtn");
  var statusLine = document.getElementById("statusLine");

  if (!form || !nameInput || !emailInput || !wearableInput || !submitBtn || !statusLine) {
    return;
  }

  function setStatus(message, tone) {
    statusLine.textContent = message || "";
    statusLine.classList.remove("ok", "warn", "bad");
    if (tone) {
      statusLine.classList.add(tone);
    }
  }

  function isValidEmail(email) {
    return EMAIL_PATTERN.test(String(email || "").trim());
  }

  async function onSubmit(event) {
    event.preventDefault();

    var name = String(nameInput.value || "").trim();
    var email = String(emailInput.value || "").trim();
    var wearable = String(wearableInput.value || "").trim();

    if (!name) {
      setStatus("Enter client name.", "bad");
      return;
    }

    if (!isValidEmail(email)) {
      setStatus("Enter a valid email address.", "bad");
      return;
    }

    if (!wearable) {
      setStatus("Select a wearable platform.", "bad");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    setStatus("Sending client info to CoachRx...", "warn");

    try {
      var response = await fetch(ENDPOINT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/plain"
        },
        body: JSON.stringify({
          name: name,
          email: email,
          wearable: wearable
        })
      });

      if (!response.ok) {
        var errorText = await response.text();
        throw new Error(errorText || "Request failed.");
      }

      setStatus("Client info sent - go add " + name + " in CoachRx now.", "ok");
      form.reset();
    } catch (error) {
      var message = error && error.message ? error.message : "Could not send client info. Please try again.";
      setStatus(message, "bad");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send to CoachRx";
    }
  }

  form.addEventListener("submit", onSubmit);
})();
