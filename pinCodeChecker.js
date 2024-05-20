const POSTAL_API = "https://api.postalpincode.in/pincode/";

const pincodeCheckerTemplate = document.createElement("template");
pincodeCheckerTemplate.innerHTML = `
<style>
    :host {
        display: block;
        width: 100%;
        height: 100%;
        line-height: 1.5;
    }

    form {
        width: 100%;
    }

    form section {
        width: 100%;
        display: flex;
        border: 1px solid #000;
        border-radius: 0.5rem;
    }

    form section input, form section button {
        font: inherit;
        font-size: 16px;
        outline: none;
        border: none;
        padding: 16px 8px;
    }

    form section input {
        background-color: #fff;
        border-radius: 0.5rem 0 0 0.5rem;
        flex-grow: 1;
    }

    form section button {
        flex-shrink: 0;
        border-radius: 0 0.5rem 0.5rem 0;
        cursor: pointer;
        background-color: #6495ed;
        border-left: 1px solid #000;
    }

    form section button:hover {
        background-color: rgba(100, 148, 237, 0.908);
    }

    .error-msg{
        color: red
    }
</style>
<div>
<form id = 'pincode-form'>
    <section>
        <input type="text" placeholder="Enter 6-digit Pincode" id = 'pincode' />
        <button type = "submit">Check</button> 
    </section>
    <p  id = 'errMsg' class = 'error-msg'></p>
</form>
<p id = "status"></p>
<p id = 'post-offices'></p>
</div>
`;

class pinCodeChecker extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.appendChild(pincodeCheckerTemplate.content.cloneNode(true));
    this.pincode = "";
    this.isPincodeValid = false;
  }

  connectedCallback() {
    this.shadowRoot
      .getElementById("pincode-form")
      .addEventListener("submit", (event) => this.onSubmitFrom(event));

    this.shadowRoot
      .getElementById("pincode")
      .addEventListener("input", (event) => this.onChangeInput(event));
  }

  onSubmitFrom(event) {
    event.preventDefault();
    this.shadowRoot.getElementById("post-offices").textContent = "";
    this.shadowRoot.getElementById("status").textContent = "";
    this.validatePincode(this.pincode);
    if (this.isPincodeValid) {
      this.fetchPincodeDetails();
    }
    this.shadowRoot.getElementById("pincode").value = "";
  }

  onChangeInput(event) {
    const pincode = event.target.value;
    this.pincode = pincode;
    this.shadowRoot.getElementById("pincode").value = pincode;
    this.validatePincode(pincode);
  }

  validatePincode(pincode) {
    const containsAlpha = isNaN(pincode);
    const isShort = pincode.length < 6;
    const isLong = pincode.length > 6;
    const isValid = pincode.length === 6 && !containsAlpha;
    this.isPincodeValid = isValid;

    if (containsAlpha) {
      this.shadowRoot.getElementById("errMsg").textContent =
        "The pincode must comprise only numerical digits";
      this.shadowRoot.getElementById("pincode").style.backgroundColor =
        "#fcbacb50";
    } else {
      if (isShort || isLong) {
        this.shadowRoot.getElementById("errMsg").textContent =
          "The pincode must comprise 6 numerical digits.";
        this.shadowRoot.getElementById("pincode").style.backgroundColor =
          "#fcbacb50";
      } else {
        this.shadowRoot.getElementById("errMsg").textContent = "";
        this.shadowRoot.getElementById("pincode").style.backgroundColor =
          "#fff";
      }
    }
  }

  async fetchPincodeDetails() {
    this.shadowRoot.getElementById("status").textContent = "Loading...";
    const url = `${POSTAL_API}${this.pincode}`;
    const options = {
      method: "GET",
      Headers: {
        "content-type": "Application/json",
      },
    };
    try {
      const response = await fetch(url, options);
      if (response.ok === true) {
        const fetchedData = await response.json();
        const data = fetchedData[0];
        const { Message, Status, PostOffice } = data;
        if (Status === "Success") {
          let postOfficesList = [];
          let deliverablePostOfficesList = [];
          if (PostOffice.length > 0) {
            for (let obj of PostOffice) {
              postOfficesList.push(obj.Name);
              if (obj.DeliveryStatus === "Delivery") {
                deliverablePostOfficesList.push(obj.Name);
              }
            }
            const postOffices = postOfficesList.join(", ");
            const deliverablePostOffices =
              deliverablePostOfficesList.join(", ");
            let results;
            if (PostOffice.length === 1) {
              results = `Post Office under pincode ${this.pincode} is`;
            } else {
              results = `Post Offices under pincode ${this.pincode} are`;
            }

            let deliveryResults;
            if (deliverablePostOfficesList.length >= 1) {
              deliveryResults = `Delivery available to ${deliverablePostOffices}.`;
            } else {
              deliveryResults = `Delivery available to None.`;
            }

            this.shadowRoot.getElementById(
              "post-offices"
            ).innerHTML = `${results} ${postOffices}. <br/> ${deliveryResults}`;
          }
          this.shadowRoot.getElementById("status").textContent = "";
        } else {
          this.shadowRoot.getElementById(
            "status"
          ).textContent = `${Message} for this pincode: ${this.pincode}`;
        }
      } else {
        const data = await response.json();
        const { Message } = data[0];
        this.shadowRoot.getElementById("status").textContent = Message;
      }
    } catch (e) {
      this.shadowRoot.getElementById("status").textContent =
        "Oops! Something went wrong";
    }
  }
}

customElements.define("pincode-checker", pinCodeChecker);
