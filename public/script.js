
document.querySelector("#startDate").value = new Date().toISOString().slice(0, 10);
document.querySelector("#semester").value = "Spring";

document.getElementById("GBD").addEventListener("click", async () => {
    const campus = document.querySelector("#campus").value;
    const semester = document.querySelector("#semester").value;
    await fetch("/api/badge", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({ campus, semester }),
    })
        .catch((err) => {
            console.log(err);
            alert("There was an error!")
        })
        .then((res) => {
            if (res.status === 200) {
                alert("The site is now working and it should fill out the spreadsheet in about 2 minutes. Repeated clicks may produce undesired results.");
            }
        });
});

document.getElementById("hours").addEventListener("click", async () => {
    const campus = document.querySelector("#campus").value;
    const semester = document.querySelector("#semester").value;
    await fetch("/api/hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campus, semester }),
    });
});

document.getElementById("userscourse").addEventListener("click", async () => {
    await fetch("/api/userscourse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course: "33" }),
    });
});
