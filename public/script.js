
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

const doHours = async () => {
    const campus = document.querySelector("#campus").value;
    const semester = document.querySelector("#semester").value;
    await fetch("/api/hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campus, semester }),
    });
}

document.getElementById("GBD").addEventListener("click", doBadge);
document.getElementById("hours").addEventListener("click", doHours);
