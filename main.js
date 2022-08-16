const baseUrl = document.currentScript.dataset.baseurl;
const access_token = document.currentScript.dataset.token;

const wcf_chatroom_form = get('.wcf-chatroom-inputarea');
const wcf_chatroom_input = get('.wcf-chatroom-input');
const wcf_chatroom_chat = get('.wcf-chatroom-chat');
const wcf_chatroom = get('.wcf-chatroom');
const fetchLoader = get('.wcf-chatroom-fetch-data-bouncing-loader');
const waitBotLoader = get('.wcf-chatroom-wait-bot-bouncing-loader');
let conversation_secret = undefined;

wcf_chatroom_form.addEventListener('submit', (event) => {
  event.preventDefault();

  const msgText = wcf_chatroom_input.value;
  if (!msgText) return;

  appendMessage('right', { text: msgText }, 'Text');
  wcf_chatroom_input.value = '';
  wcf_chatroom_chat.scrollTop = wcf_chatroom_chat.scrollHeight;
  sendMessage(msgText);
});

let currentPage = 1;
const limit = 200;
let total = 0;

document.addEventListener('DOMContentLoaded', (e) => {
  getChatbotToken(() => loadMessages(currentPage, limit));
});

const getChatbotToken = (callback) => {
  showWaitBotLoader();
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      hideWaitBotLoader();
    }
    if (this.readyState == 4 && this.status == 200) {
      conversation_secret = JSON.parse(this.response).conversation_secret;
      if (callback) {
        callback();
      }
    }
  };
  xhttp.open('POST', `${baseUrl}/startConversation`, true);
  xhttp.setRequestHeader('Authorization', `Bearer ${access_token}`);
  xhttp.send();
};

wcf_chatroom_chat.addEventListener(
  'scroll',
  (event) => {
    const { scrollTop, scrollHeight, clientHeight } = wcf_chatroom_chat;

    if (scrollTop <= 5 && hasMoreMessages(currentPage, limit, total)) {
      currentPage++;
      loadMessages(currentPage, limit);
    }
  },
  {
    passive: true,
  }
);

const hasMoreMessages = (page, limit, total) => {
  const startIndex = (page - 1) * limit + 1;
  return total === 0 || startIndex < total;
};

// load Messages
const loadMessages = (page, limit) => {
  if (conversation_secret) {
    // show the loader
    showFetchHistoryLoader();
    try {
      // if having more Messages to fetch
      if (hasMoreMessages(page, limit, total)) {
        // call the API to get Messages
        getMessages(page, limit, (response) => {
          // show Messages
          if (response.response) {
            response.response.forEach((message) => {
              const side = message.type_name == 'bot' ? 'left' : 'right';
              appendMessageNoType(side, message, 'afterbegin');
            });
          }
          // update the total
          total = response.total;
        });
      }
    } catch (error) {
      console.log(error.message);
    } finally {
      hideFetchHistoryLoader();
    }
  }
};

// get the Messages from API
const getMessages = (page, limit, callback) => {
  const API_URL = `${baseUrl}/message?page=${page}&page_size=${limit}`;
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      hideWaitBotLoader();
    }
    if (this.readyState == 4 && this.status == 200) {
      console.log(this.response);
      if (callback) {
        callback(JSON.parse(this.response));
      }
    }
  };
  xhttp.open('GET', API_URL, true);
  xhttp.setRequestHeader('x-conversation-secret', conversation_secret);
  xhttp.send();
};

function showFetchHistoryLoader() {
  hideFetchHistoryLoader();
  const msgHTML = `
  <div  id="wcf-chatroom-fetch-data-loader" class="wcf-chatroom-fetch-data-bouncing-loader show-wcf-chatroom-fetch-data-bouncing-loader">
    <div></div>
    <div></div>
    <div></div>
  </div>`;
  wcf_chatroom_chat.insertAdjacentHTML('afterbegin', msgHTML);
}

function hideFetchHistoryLoader() {
  var msg_loader = document.getElementById('wcf-chatroom-fetch-data-loader');
  if (msg_loader) {
    wcf_chatroom_chat.removeChild(msg_loader);
  }
}

function showWaitBotLoader() {
  hideWaitBotLoader();
  const msgHTML = `
  <div id="wcf-chatroom-msg-bot-loader" class="wcf-chatroom-msg left-msg">
    <div class="wcf-chatroom-msg-img avatar"></div>
    <div class="wcf-chatroom-msg-bubble">
      <div class="wcf-chatroom-wait-bot-bouncing-loader show-wcf-chatroom-wait-bot-bouncing-loader">
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  </div>`;
  wcf_chatroom_chat.insertAdjacentHTML('beforeend', msgHTML);
  wcf_chatroom_chat.scrollTop += 200;
}

function hideWaitBotLoader() {
  var msg_loader = document.getElementById('wcf-chatroom-msg-bot-loader');
  if (msg_loader) {
    wcf_chatroom_chat.removeChild(msg_loader);
  }
}

function sendMessage(msgText, payload = undefined) {
  showWaitBotLoader();
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4) {
      hideWaitBotLoader();
    }
    if (this.readyState == 4 && this.status == 200) {
      sendMessageCallback(JSON.parse(this.response));
    }
  };
  xhttp.open('POST', `${baseUrl}/message`, true);
  xhttp.setRequestHeader('Content-Type', 'application/json');
  xhttp.setRequestHeader('x-conversation-secret', conversation_secret);
  if (payload) {
    xhttp.send(`{ "text": "${msgText}", "payload": "${payload}" }`);
  } else {
    xhttp.send(`{ "text": "${msgText}" }`);
  }
}

function sendMessageCallback(res) {
  res.response.forEach((element) => {
    appendMessageNoType('left', element);
  });
}

function appendMessageNoType(side, contentElement, position = 'beforeend') {
  if (contentElement.image) {
    appendMessage(side, contentElement, 'Image', position);
  } else if (contentElement.buttons) {
    appendMessage(side, contentElement, 'Button', position);
  } else if (contentElement.text) {
    appendMessage(side, contentElement, 'Text', position);
  }
}

// Get the modal
var modal = document.getElementById('myModal');

// Get the image and insert it inside the modal - use its "alt" text as a caption
var modalImg = document.getElementById('img01');
function onClickImageContent(src) {
  modal.style.display = 'block';
  modalImg.src = src;
}

// Get the <span> element that closes the modal
var span = document.getElementsByClassName('close')[0];

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
  modal.style.display = 'none';
};

document
  .getElementById('wcf-chatroom-message-tb')
  .addEventListener('keypress', submitOnEnter);

function submitOnEnter(event) {
  if (event.which === 13) {
    event.target.form.dispatchEvent(new Event('submit', { cancelable: true }));
    event.preventDefault(); // Prevents the addition of a new line in the text field (not needed in a lot of cases)
  }
}

function onClickCloseChat() {
  alert('Hi');
}
let last_side = '';
function appendMessage(
  side,
  contentElement,
  type = 'Text',
  position = 'beforeend'
) {
  let date = formatDate(new Date());
  if (contentElement.timestamp) {
    date = formatDate(new Date(contentElement.timestamp * 1000));
  }
  const avatar_icon = `<div class="wcf-chatroom-msg-img avatar"></div>`;
  const show_left_icon = side === 'right' ? '' : avatar_icon;
  const element_id = `wcf-chatroom-msg-${performance.now()}`;
  const msgHTML = `
    <div id="${element_id}" class="wcf-chatroom-msg ${side}-msg">
    ${show_left_icon ?? avatar_icon}
      <div class="wcf-chatroom-msg-bubble">
        ${getResponseContent(type, contentElement)}
      </div>
      <div class="wcf-chatroom-msg-info-time">${date}</div>
    </div>
  `;
  wcf_chatroom_chat.insertAdjacentHTML(position, msgHTML);
  last_side = side;
  var messageHeight = document.getElementById(element_id).clientHeight;
  wcf_chatroom_chat.scrollTop += messageHeight + 10;
}

function getResponseContent(type, contentElement) {
  switch (type) {
    case 'Text':
      return getContentText(contentElement);
    case 'Image':
      return getContentImage(contentElement);
    case 'Button':
      return getContentButton(contentElement);
    default:
      return getContentText(text);
  }
}

function auto_height(elem) {
  elem.style.height = '1px';
  elem.style.height = elem.scrollHeight - 18 + 'px';
}

function getContentButton(contentElement) {
  let buttonsHtml = getContentText(contentElement);
  contentElement.buttons.forEach((button) => {
    buttonsHtml += `
        <button class="quick-reply-btn" onclick="onClickQuickReply('${button.title}', '${button.payload}')">
            <span>${button.title}</span>
        </button>`;
  });
  return `<div class="msg-button">
        ${buttonsHtml}
    </div>`;
}

function onClickQuickReply(text, payload) {
  const msgText = text;
  if (!msgText) return;

  const msgPayload = payload;
  if (!msgPayload) return;

  appendMessage('right', { text: msgText }, 'Text');
  wcf_chatroom_input.value = '';
  wcf_chatroom_chat.scrollTop = wcf_chatroom_chat.scrollHeight;
  sendMessage(msgText, msgPayload);
}

function getContentImage(contentElement) {
  return `${getContentText(contentElement)}<div class="msg-image"><img src="${
    contentElement.image
  }" onclick="onClickImageContent('${contentElement.image}')"></img></div>`;
}

function getContentText(contentElement) {
  return `<div class="msg-text">${contentElement.text}</div>`;
}

// Utils
function get(selector, root = document) {
  return root.querySelector(selector);
}

function formatDate(date) {
  const h = '0' + date.getHours();
  const m = '0' + date.getMinutes();

  return `${h.slice(-2)}:${m.slice(-2)}`;
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}
