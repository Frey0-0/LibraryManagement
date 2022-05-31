
xhttp.open("GET", "https://localhost:5500/checkin");
xhttp.send();
xhttp.onload = await function () {
    data = this.response;
    approval = data.approval;
    for (i = 0; i < approval.length; i++) {
        s += 'Book Name: ' + approval[i].name + ' User name: ' + approval[i].user + '<br><form action="/approved" method="POST"><input type="text" name="bname" value=' + approval[i].name + ' style="display:none">' +
            '<br><input type="text" name="uname" value="+list.approval[i].name+" style="display:none"><br><input type="submit" value="Approve"></form><br>' +
            '<form action="/disapproved" method="POST"><input type="text" name="bname" value= ' + approval[i].name + ' style="display:none">' +
            '<br><input type="text" name="uname" value=' + approval[i].name + ' style="display:none"><br><input type="submit" value="Disapprove"></form><br>';
    }
}
xhttp.open("GET", "https://localhost:5500/checkout");
xhttp.send();
xhttp.onload = await function () {
    data = this.response;
    ret = data.ret;
    for (i = 0; i < ret.length; i++) {
        let today = new Date();
        let fees = (today.getFullYear() - list.ret[i].year) * 365 + (today.getMonth() + 1 - list.ret[i].month) * 30 + (today.getDate() - list.ret[i].day);
        s1 += 'Book Name: ' + ret[i].name + ' User name: ' + ret[i].user + ' Charges: ' + fees + '<br><form action="/approved1" method="POST"><input type="text" name="bname" value= ' + ret[i].name + ' style="display:none">' +
            '<br><input type="text" name="uname" value=' + ret[i].name + ' style="display:none"><br><input type="submit" value="Approve"></form><br>' +
            '<form action="/disapproved1" method="POST"><input type="text" name="bname" value=' + ret[i].name + ' style="display:none">' +
            '<br><input type="text" name="uname" value=' + ret[i].name + ' style="display:none"><br><input type="submit" value="Disapprove"></form><br>';
    }
}
