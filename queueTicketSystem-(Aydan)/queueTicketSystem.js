function createQueueTicket(stallId, customerName, orderId) {
  var db = loadDB();
  var q = null;
  for (var i = 0; i < db.queues.length; i++) {
    if (db.queues[i].stallId === stallId) {
      q = db.queues[i];
      break;
    }
  }
  if (!q) return null;
  if (orderId) {
    for (var j = 0; j < q.tickets.length; j++) {
      if (q.tickets[j].orderId === orderId) {
        return q.tickets[j];
      }
    }
  }
  var maxNo = 0;
  for (var k = 0; k < q.tickets.length; k++) {
    if (q.tickets[k].ticketNo > maxNo) maxNo = q.tickets[k].ticketNo;
  }
  var nextNo = maxNo + 1;
  var ahead = 0;
  for (var m = 0; m < q.tickets.length; m++) {
    var st = q.tickets[m].status || "WAITING";
    if (st === "WAITING" || st === "CALLED") ahead++;
  }
  var ticket = {
    ticketId: makeId("tkt"),
    ticketNo: nextNo,
    orderId: orderId || null,
    stallId: stallId,
    name: customerName || "Customer",
    createdDateTime: new Date().toISOString(),
    status: "WAITING",
    etaMinutes: ahead * 4
  };

  q.tickets.push(ticket);
  saveDB(db);

  return ticket;
}
function getQueueInfo(stallId, ticketId) {
  var db = loadDB();

  var q = null;
  for (var i = 0; i < db.queues.length; i++) {
    if (db.queues[i].stallId === stallId) {
      q = db.queues[i];
      break;
    }
  }
  if (!q) return null;

  
  var ticket = null;
  for (var j = 0; j < q.tickets.length; j++) {
    if (q.tickets[j].ticketId === ticketId) {
      ticket = q.tickets[j];
      break;
    }
  }
  if (!ticket) return null;

  
  var ahead = 0;
  for (var k = 0; k < q.tickets.length; k++) {
    var t = q.tickets[k];
    var st = t.status || "WAITING";
    var active = (st === "WAITING" || st === "CALLED");

    if (!active) continue;
    if (t.ticketNo < ticket.ticketNo) ahead++;
  }

  return {
    ticketNo: ticket.ticketNo,
    peopleAhead: ahead,
    position: ahead + 1,
    etaMinutes: ahead * 4, 
    status: ticket.status || "WAITING"
  };
}