// content.js
// MyCoal Auto Clicker — human-like automation + OTP polling

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function typeLikeHuman(element, text, baseDelay = 30) {
  try {
    element.focus();
    element.value = "";
  } catch (e) {}
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    element.value = element.value + char;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    // randomize to mimic human typing
    await sleep(baseDelay);
  }
}

async function clickByText(selectors, text) {
  const nodes = [...document.querySelectorAll(selectors)];
  const el = nodes.find(n => (n.innerText || "").trim() === text);
  if (el) {
    // if inner span found, click outer clickable element if possible
    try {
      el.click();
    } catch (e) {
      // fallback: dispatch mouse events
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
    return true;
  }
  return false;
}

async function runAutomation() {
  console.log("🚀 MyCoal Auto Clicker boshlandi...");

  // 1. "Aholi uchun ariza"
  if (await clickByText("button, span", "Aholi uchun ariza")) {
    await sleep(2000);
  } else {
    console.warn("Aholi uchun ariza topilmadi");
  }

  // 2. "Import Ko'mir" spanni bosish
  if (await clickByText("span", "Import Ko'mir")) {
    await sleep(1000);
  } else {
    console.warn("Import Ko'mir span topilmadi");
  }

  // 3. "Boshqa" radio label
  if (await clickByText("span.ant-radio-label", "Boshqa")) {
    await sleep(900);
  } else {
    console.warn("'Boshqa' radio topilmadi");
  }

  // 4. "Import ko'mir" radio label
  if (await clickByText("span.ant-radio-label", "Import ko'mir")) {
    await sleep(900);
  } else {
    console.warn("'Import ko'mir' radio topilmadi");
  }

  // 5. Og'irlik inputiga 2000 yozish (odamdek)
  const inputWeight = document.querySelector("input#quantity");
  if (inputWeight) {
    await typeLikeHuman(inputWeight, "2000", 140);
    await sleep(700);
  } else {
    console.warn("Og'irlik inputi (#quantity) topilmadi");
  }

  // 6. "Keyingisi" tugmasi
  const keyBtnSpan = [...document.querySelectorAll("button span")].find(el => (el.innerText || "").trim() === "Keyingisi");
  if (keyBtnSpan && keyBtnSpan.parentElement) {
    keyBtnSpan.parentElement.click();
    await sleep(2500);
  } else {
    console.warn("'Keyingisi' tugmasi topilmadi");
  }

  // 7. Telefon inputi
  const telInputSelector = "input[placeholder='+998 __ ___-__-__'], input[placeholder='+998 __ ___ __ __']";
  const telInput = document.querySelector(telInputSelector);
  if (telInput) {
    await typeLikeHuman(telInput, "200013931", 120);
    await sleep(1000);
  } else {
    console.warn("Telefon inputi topilmadi");
  }

  // 8. "Kod olish" tugmasi
  const kodBtnSpan = [...document.querySelectorAll("button span")].find(el => (el.innerText || "").trim() === "Kod olish");
  if (kodBtnSpan && kodBtnSpan.parentElement) {
    kodBtnSpan.parentElement.click();
    await sleep(1200);
  } else {
    console.warn("'Kod olish' tugmasi topilmadi");
  }

  // 9. Polling: har 3 soniyada https://fidi4c-ip-95-214-210-123.tunnelmole.net/?get=code ga so'rov
  const POLL_URL = "https://fidi4c-ip-95-214-210-123.tunnelmole.net/?get=code";
  const POLL_INTERVAL_MS = 3000; // 3s
  const MAX_WAIT_MS = 60 * 1000; // 60s
  const start = Date.now();

  console.log("🔎 SMS kodni kutyapman... (maks 60s, har 3s so'rov)");

  let foundCode = null;

  while (Date.now() - start < MAX_WAIT_MS) {
    try {
      const resp = await fetch(POLL_URL, {
        method: "GET", // yoki "POST", agar ma'lumot yuborayotgan bo‘lsangiz
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        cache: "no-store",
        mode: "cors"
        });

      if (!resp.ok) {
        console.warn("Server javobi ok emas:", resp.status);
      } else {
        const data = await resp.json();
        // structure expected: { code: "48648", requested: 2, time: "..." }
        console.log("Polling javobi:", data);
        if (data && typeof data === "object") {
          const requested = Number(data.requested);
          const code = String(data.code || "");
          if (!Number.isNaN(requested) && code.length >= 1) {
            if (requested === 1) {
              foundCode = code;
              console.log("✅ Yangi SMS kodi topildi:", code);
              break;
            } else {
              console.log(`requested=${requested} — eski/ishlatilgan kod, kutamiz...`);
            }
          } else {
            console.warn("Caution: server returned unexpected payload", data);
          }
        }
      }
    } catch (err) {
      console.error("Polling fetch hatosi:", err);
    }
    await sleep(POLL_INTERVAL_MS);
  }

  if (!foundCode) {
    console.error("⏱ 60 soniya ichida yangi SMS kod kelmadi. Jarayon to'xtadi.");
    return;
  }

  // 10. Agar kod olinsa — OTP inputlarga odamdek yozish
  // Kod uzunligi misolda 5. Ammo qoida sifatida kodni har xonaga alohida joylashtiramiz.
  const otpInputs = [...document.querySelectorAll(".styles_otp_input__Q2nf5 input.ant-otp-input, .ant-otp input.ant-otp-input, input[aria-label^='OTP Input']")].slice(0, 10);
  if (!otpInputs || otpInputs.length === 0) {
    console.warn("OTP inputlari topilmadi. Kod:", foundCode);
    return;
  }

  // Ensure we have enough inputs for code length; if not, only fill available ones.
  const codeStr = foundCode.trim();
  for (let i = 0; i < Math.min(codeStr.length, otpInputs.length); i++) {
    const ch = codeStr[i];
    const inputEl = otpInputs[i];
    // human-like delay before typing each digit
    await sleep(200);
    inputEl.focus();
    inputEl.value = ch;
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    inputEl.dispatchEvent(new Event("change", { bubbles: true }));
  }

  console.log("🎯 OTP kod kiritildi:", codeStr);

    await sleep(2000);

  // 11. "Keyingisi" tugmasi
  const keyingi1BtnSpan = [...document.querySelectorAll("button span")].find(el => (el.innerText || "").trim() === "Keyingisi");
  if (keyingi1BtnSpan && keyingi1BtnSpan.parentElement) {
    keyingi1BtnSpan.parentElement.click();
    await sleep(1500);
  } else {
    console.warn("'Keyingisi' tugmasi topilmadi");
  }

  // 12. "Keyingisi" tugmasi
  const keyingi2BtnSpan = [...document.querySelectorAll("button span")].find(el => (el.innerText || "").trim() === "Keyingisi");
  if (keyingi2BtnSpan && keyingi2BtnSpan.parentElement) {
    keyingi2BtnSpan.parentElement.click();
    await sleep(1500);
  } else {
    console.warn("'Keyingisi' tugmasi topilmadi");
  }

  // 13. "Keyingisi" tugmasi
  const keyingi3BtnSpan = [...document.querySelectorAll("button span")].find(el => (el.innerText || "").trim() === "Keyingisi");
  if (keyingi3BtnSpan && keyingi3BtnSpan.parentElement) {
    keyingi3BtnSpan.parentElement.click();
    await sleep(1500);
  } else {
    console.warn("'Keyingisi' tugmasi topilmadi");
  }

    await sleep(1500);  
    await runAutomation();

  console.log("✅ MyCoal Auto Clicker tugadi.");
}

// Export runAutomation so background can inject file multiple times without re-defining
runAutomation();
