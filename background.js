chrome.commands.onCommand.addListener(async (command) => {
  if (command === "run-automation") {
    // Faol tabga content.js ni injekt qilish
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      });
    }
  }
});
