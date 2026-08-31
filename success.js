document.getElementById("okBtn").addEventListener("click", () => {
  sessionStorage.removeItem("pp_phone");
  window.location.href = "index.html";
});
