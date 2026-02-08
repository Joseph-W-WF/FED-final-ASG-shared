// queue ticket system (in-memory via db.js)
// this file adds 2 helper functions so a stall can manage a simple "take number" queue
// logic summary:
// - tickets live under db.queues[] for each stall
// - ticket numbers increment from the current max
// - eta is estimated by counting how many active tickets are ahead (waiting/called) * 4 minutes

function createQueueTicket(stallId, customerName, orderId) {
  // load the shared in-memory db
  var db = loadDB();

  // find the queue object for this stall
  var q = null;
  for (var i = 0; i < db.queues.length; i++) {
    if (db.queues[i].stallId === stallId) {
      q = db.queues[i];
      break;
    }
  }
  if (!q) return null;

  // if an order id is provided, reuse the existing ticket for that order (prevents duplicates)
  if (orderId) {
    for (var j = 0; j < q.tickets.length; j++) {
      if (q.tickets[j].orderId === orderId) {
        return q.tickets[j];
      }
    }
  }

  // compute the next ticket number by taking the largest existing number + 1
  var maxNo = 0;
  for (var k = 0; k < q.tickets.length; k++) {
    if (q.tickets[k].ticketNo > maxNo) maxNo = q.tickets[k].ticketNo;
  }
  var nextNo = maxNo + 1;

  // estimate how many people are ahead by counting active tickets
  // active tickets are still in progress (waiting/called)
  var ahead = 0;
  for (var m = 0; m < q.tickets.length; m++) {
    var st = q.tickets[m].status || "WAITING";
    if (st === "WAITING" || st === "CALLED") ahead++;
  }

  // build the new ticket object
  var ticket = {
    ticketId: makeId("tkt"),
    ticketNo: nextNo,
    orderId: orderId || null,
    stallId: stallId,
    name: customerName || "Customer",
    createdDateTime: new Date().toISOString(),
    status: "WAITING",

    // simple eta: 4 mins per active ticket ahead
    etaMinutes: ahead * 4
  };

  // persist ticket into the stall queue
  q.tickets.push(ticket);
  saveDB(db);

  return ticket;
}

function getQueueInfo(stallId, ticketId) {
  // load the shared in-memory db
  var db = loadDB();

  // find the queue for this stall
  var q = null;
  for (var i = 0; i < db.queues.length; i++) {
    if (db.queues[i].stallId === stallId) {
      q = db.queues[i];
      break;
    }
  }
  if (!q) return null;

  // find the specific ticket
  var ticket = null;
  for (var j = 0; j < q.tickets.length; j++) {
    if (q.tickets[j].ticketId === ticketId) {
      ticket = q.tickets[j];
      break;
    }
  }
  if (!ticket) return null;

  // count how many active tickets are ahead of this ticket number
  // we only compare ticketNo so even if the array order changes, the position stays correct
  var ahead = 0;
  for (var k = 0; k < q.tickets.length; k++) {
    var t = q.tickets[k];
    var st = t.status || "WAITING";
    var active = (st === "WAITING" || st === "CALLED");

    if (!active) continue;
    if (t.ticketNo < ticket.ticketNo) ahead++;
  }

  // return a small summary object for ui display
  return {
    ticketNo: ticket.ticketNo,
    peopleAhead: ahead,
    position: ahead + 1,

    // same eta rule: 4 mins per person ahead
    etaMinutes: ahead * 4,
    status: ticket.status || "WAITING"
  };
}
