document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log(emails)
    const container = document.querySelector('#emails-view')
    if (emails.length == 0) {
      container.innerHTML += "No emails to display";
      return;
    }

    if (emails.hasOwnProperty('error')) {
      container.innerHTML = emails.error;
      return;
    }
    emails.forEach(email => {
      let element = document.createElement('div')
      element.className += "card"
      
      let elementChild = document.createElement('div')
      elementChild.className += "card-body"
      elementChild.addEventListener('click', () => {
        fetch(`/emails/${email.id}`)
        .then(response => response.json())
        .then(email => {

          if (email.hasOwnProperty('error')) {
            container.innerHTML = email.error
          }
          load_email(email, mailbox)
        })
      })
      
      let title = document.createElement('h5')
      title.className += "card-title"
      title.innerHTML = email.subject

      let sender = document.createElement('h6')
      sender.className += 'card-subtitle text-muted mb-2'
      sender.innerHTML = `From ${email.sender}`

      let time = document.createElement('div')
      time.className += 'card-footer text-muted'
      time.innerHTML = `Sent on ${email.timestamp}`

      elementChild.append(title)
      elementChild.append(sender)
      
      if (email.read){
        elementChild.style.background = "rgba(0, 0, 0, 0.03)"
      }

      element.append(elementChild)
      element.append(time)

      container.append(element)
    })
  })
}

function send_email() {

  const recipients = document.querySelector('#compose-recipients').value
  const subject = document.querySelector('#compose-subject').value
  const body = document.querySelector('#compose-body').value
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      
      if (result.hasOwnProperty('error')) {
        document.querySelector('#compose-view').innerHTML = result.error;
      }
  })
  load_mailbox('inbox')
}

function load_email(mail, mailbox) {
  
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'block';

  document.querySelector('#sender').innerHTML = `<strong>From: </strong>${mail.sender}`;
  document.querySelector('#recipients').innerHTML = `<strong>To: </strong>${mail.recipients.join(", ")}`;
  document.querySelector('#subject').innerHTML = `<strong>Subject: </strong>${mail.subject}`;
  document.querySelector('#subject').style.fontSize = 'larger';
  document.querySelector('#time').innerHTML = `<strong>Sent on: </strong>${mail.timestamp}`;
  document.querySelector('#body').innerHTML = mail.body;

  archive_button = document.querySelector("#archive");
  reply_button = document.querySelector('#reply')
  if (mailbox !== 'sent') {
    archive_button.style.display = "block"
    reply_button.style.display= "block"
    if (mail.archived) {
      archive_button.innerHTML = "Unarchive";
    }
    else {
      archive_button.innerHTML = "Archive";
    }
  }
  else {
    archive_button.style.display = "none";
    reply_button.style.display = "none";
  }
  
  if (!(mail.read)) {
    fetch(`/emails/${mail.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    })
  }

  reply_button.onclick = () => {

  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  document.querySelector('#compose-recipients').value = `${mail.sender}`;
  document.querySelector('#compose-subject').value = (mail.subject.slice(0,4) === "Re :") ? mail.subject : ("Re: " + mail.subject)
  document.querySelector('#compose-body').value = `On ${mail.timestamp}, ${mail.sender} wrote: ${mail.body}`;
  }

  archive_button.onclick = () => {
    archive_mail(mail);
    setTimeout(load_mailbox, 100, 'inbox');
  }
}

function archive_mail(mail) {
  console.log("Clicked!")
  let obj = {}
  obj["archived"] = !(mail.archived)
  fetch(`/emails/${mail.id}`, {
    method: 'PUT',
    body: JSON.stringify(obj)
  })
}