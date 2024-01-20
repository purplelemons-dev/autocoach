
document.querySelector("#startDate").value = new Date().toISOString().slice(0, 10);

const doBadge = async () => {
    const campus = document.querySelector("#campus").value;
    const startDate = document.querySelector("#startDate").value;
    await fetch("/api/badge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campus, startDate }),
    });
};

document.getElementById("GBD").addEventListener("click", doBadge);
