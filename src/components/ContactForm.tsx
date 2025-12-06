import { useState } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
// import emailjs from "emailjs-com";
import { getData } from "country-list";
// import countryData from "country-telephone-data";

// interface Country {
//   name: string;
//   iso2: string;
//   dialCode: string;
// }

export default function ContactForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [service, setService] = useState<string[]>([]);
  const [businessStatus, setBusinessStatus] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState<string | undefined>();
  const [message, setMessage] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [modal, setModal] = useState<{ open: boolean; message: string; type: "success" | "error" }>({
    open: false,
    message: "",
    type: "success",
  });

  // EMAIL + OTP
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);

  // COUNTRY + CODE
  const countries = getData();
  // const phoneCodes: Country[] = countryData.allCountries.map((c) => ({
  //   name: c.name,
  //   iso2: c.iso2,
  //   dialCode: c.dialCode,
  // }));

  // Email validation
  const validateEmail = (value: string) => {
    setEmail(value);
    if (!value) setEmailError("Email is required");
    else if (!/^\S+@\S+\.\S+$/.test(value)) setEmailError("Invalid email format");
    else setEmailError("");
  };

  // SEND OTP
  const sendOtp = async () => {
    if (!email) {
      setEmailError("Email is required");
      return;
    }
    if (emailError) return;

    try {
      const res = await fetch("http://localhost:5000/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!data.success) {
        setModal({ open: true, message: data.error || "Failed to send OTP", type: "error" });
        return;
      }
      setModal({ open: true, message: "OTP sent!", type: "success" });
      // Store OTP in localStorage
      localStorage.setItem(
        "email_otp",
        JSON.stringify({ code: data.otp, expires: Date.now() + 5 * 60 * 1000 })
      );



      setOtpSent(true);
      alert("OTP sent!");
    } catch (err) {
      console.error(err);
      alert("Network error!");
    }
  };

  // VERIFY OTP
const verifyOtp = () => {
  const stored = localStorage.getItem("email_otp");

  if (!stored) {
    setModal({ open: true, message: "No OTP stored — request again", type: "error" });
    return;
  }

  const { code, expires } = JSON.parse(stored);

  if (Date.now() > expires) {
    setModal({ open: true, message: "OTP expired, please resend", type: "error" });
    localStorage.removeItem("email_otp");
    return;
  }

  if (otp === code) {
    setVerified(true);
    localStorage.removeItem("email_otp");
    setModal({ open: true, message: "Email verified!", type: "success" });
  } else {
    setModal({ open: true, message: "Invalid OTP!", type: "error" });
  }
};

// HANDLE FORM SUBMIT
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!verified) {
    setModal({ open: true, message: "Please verify your email first!", type: "error" });
    return;
  }

  // if (!agreeTerms) {
  //   setModal({ open: true, message: "You must agree to Terms & Conditions!", type: "error" });
  //   return;
  // }

  // --- Build COMMON TEXT DATA ---
  const buildFormData = () => {
    const fd = new FormData();
    fd.append("firstName", firstName);
    fd.append("lastName", lastName);
    fd.append("name", `${firstName} ${lastName}`);
    fd.append("email", email);
    fd.append("phone", phone || "");
    fd.append("company", company || "");
    fd.append("businessStatus", businessStatus);
    fd.append("country", country);
    fd.append("message", message || "");
    fd.append("agreeTerms", agreeTerms ? "true" : "false");
    fd.append("agreeMarketing", agreeMarketing ? "true" : "false");
    
    service.forEach((s) => fd.append("service[]", s));
    files.forEach((file) => fd.append("files", file));

    return fd;
  };


  try {
    // 1) SEND EMAIL
    //const formEmail = buildFormData();
    // await fetch("http://localhost:5000/send-mail", {
    //   method: "POST",
    //   body: formEmail,
    // });

    // 2) CREATE LEAD
    const formLead = buildFormData();
    await fetch("http://localhost:5000/add-lead", {
      method: "POST",
      body: formLead,
    });

    setModal({ open: true, message: "✔ Message sent & CRM lead created!", type: "success" });
  } catch (err) {
    console.error(err);
    setModal({ open: true, message: "❌ Failed, please try again", type: "error" });
  }
};


  const toggleService = (value: string) => {
    setService((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  return (
    <form
      className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow-md space-y-6"
      style={{ fontFamily: "'Kanit', sans-serif" }}
      onSubmit={handleSubmit}
    >
        {/* <h1
            style={{
                fontSize: "48px",
                color: "#a50019",
                textAlign: "center",
                fontFamily: "'Playfair Display', serif",
                fontWeight: 900,
                fontStyle: "normal",
            }}
            className="fade-in"
            >
        Contact Us
        </h1> */}


      {/* Name (responsive flex) */}
      <div className="flex flex-col gap-2">
        <label className="font-medium" style={{ fontSize: "1.1rem",fontWeight: 400 }}>First Name*</label>
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First Name"
          className="w-full h-12 border border-black rounded-[10px] px-3"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-medium" style={{ fontSize: "1.1rem",fontWeight: 400 }}>Last Name*</label>
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last Name"
          className="w-full h-12 border border-black rounded-[10px] px-3"
          required
        />
      </div>

      {/* Email + OTP */}
      <div>
        <label className="font-medium" style={{ fontSize: "1.1rem",fontWeight: 400 }}>Email*</label>
        <input
          type="email"
          value={email}
          onChange={(e) => validateEmail(e.target.value)}
          placeholder="Email"
          className={`w-full border h-12 px-3 py-2 rounded-[10px] mt-2 ${emailError ? "border-red-500" : ""}`}
          required
        />
        {emailError && <p className="text-red-500 text-xs">{emailError}</p>}

        {!verified && (
          <div className="mt-2">
            {!otpSent ? (
              <button
                type="button"
                onClick={sendOtp}
                className="w-full bg-green-600 text-white py-2 rounded-lg"
              >
                Send OTP
              </button>
            ) : (
              <>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="w-full border px-3 py-2 rounded-lg mt-2"
                />
                <button
                  type="button"
                  onClick={verifyOtp}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg mt-2"
                >
                  Verify OTP
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Company */}
      <div>
        <label className="font-medium" style={{ fontSize: "1.1rem",fontWeight: 400 }}>Company Name*</label>
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Company Name"
          className="w-full h-12 border border-black rounded-[10px] px-3 mt-2"
          required
        />
      </div>

      {/* Service checkboxes */}
      <div className="flex flex-col gap-2">
        <label className="font-medium" style={{ fontSize: "1.1rem",fontWeight: 400 }}>How can we help you?*</label>
        <div className="flex flex-col gap-1">
          {["ODM", "OEM", "Other"].map((option) => (
            <label key={option} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={service.includes(option)}
                onChange={() => toggleService(option)}
              />
              {option === "ODM" ? "ODM (Your brand, our designs)" :
               option === "OEM" ? "OEM (You design, we create)" :
               "Other"}
            </label>
          ))}
        </div>
      </div>

      {/* Business Status */}
      <div>
        <label className="font-medium" style={{ fontSize: "1.1rem",fontWeight: 400 }}>Business Status*</label>
        <select
          value={businessStatus}
          onChange={(e) => setBusinessStatus(e.target.value)}
          className="w-full h-12 border border-black rounded-[10px] px-3 mt-2"
          required
        >
          <option value="">Select Business Status</option>
          <option value="In the business">In the business</option>
          <option value="Startup">Startup</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Country */}
      <div>
        <label className="font-medium" style={{ fontSize: "1.1rem",fontWeight: 400 }}>Country*</label>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full h-12 border border-black rounded-[10px] px-3 mt-2"
          required
        >
          <option value="">Select Country</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Phone */}
      <div>
        <label className="font-medium" style={{ fontSize: "1.1rem",fontWeight: 400 }}>Phone*</label>
        <div className="mt-2">
          <PhoneInput
            country={country.toLowerCase()}
            value={phone ?? ""}
            onChange={setPhone}
            placeholder="Phone number"
            className="w-full h-12 border border-black rounded-[10px] px-3"
          />
        </div>
      </div>

      {/* Message */}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Message"
        className="w-full border border-black rounded-[10px] px-3 py-2"
      />

      {/* File Upload Button */}
      <label className="font-medium" style={{ fontSize: "1.1rem",fontWeight: 400 }}>Upload Images <br /> (e.g., concept art, designs, inspirations)</label>
      <label className="block w-full border border-gray-400 rounded-lg px-3 py-2 text-center cursor-pointer bg-white hover:bg-gray-50">
        
        {files.length > 0 ? `${files.length} file(s) selected` : "Choose file(s)"}
        <input
          type="file"
          multiple
          onChange={(e) => e.target.files && setFiles(Array.from(e.target.files))}
          className="hidden"
        />
      </label>

      {/* Checkboxes */}
      <div className="flex flex-col gap-2">
        <label>
          
          I understand that Royi Sal Jewelry team will use my data to contact me. <a href="https://royisal.com/terms/" target="_blank" rel="noopener noreferrer" className=" text-red-700">Read Terms & Conditions</a>
        </label>
        <label>
          <input
            type="checkbox"
            checked={agreeMarketing}
            onChange={(e) => setAgreeMarketing(e.target.checked)}
          />{" "}
          I agree to receive other communications from Royi Sal Jewelry.
        </label>
      </div>

      <button
        type="submit"
        disabled={!verified}
        className={`w-full py-2 rounded-lg ${verified ? "bg-[#a50019] text-white" : "bg-gray-400 cursor-not-allowed"}`}
      >
        Submit
      </button>
    {modal.open && (
      <div className="fixed inset-0 flex items-center justify-center min-w-full  bg-opacity-50 z-50">
        <div className="bg-white rounded-xl shadow-lg p-6 w-1/3 text-center">
          <h2 className={`text-lg font-bold mb-4 ${modal.type === "error" ? "text-red-600" : "text-green-600"}`}>
            {modal.type === "error" ? "Error" : "Success"}
          </h2>
          <p className="mb-4">{modal.message}</p>
          <button
            className="px-4 py-2 bg-[#a50019] text-white rounded-lg"
            onClick={() => setModal({ ...modal, open: false })}
          >
            Close
          </button>
        </div>
      </div>
    )}

    </form>
  );
}
