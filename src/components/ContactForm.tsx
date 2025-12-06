import { useState } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import emailjs from "emailjs-com";
import { getData } from "country-list";
import countryData from "country-telephone-data";

interface Country {
  name: string;
  iso2: string;
  dialCode: string;
}

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

  // EMAIL + OTP
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);

  // COUNTRY + CODE
  const countries = getData();
  const phoneCodes: Country[] = countryData.allCountries.map((c) => ({
    name: c.name,
    iso2: c.iso2,
    dialCode: c.dialCode,
  }));

  // Email validation
  const validateEmail = (value: string) => {
    setEmail(value);
    if (!value) setEmailError("Email is required");
    else if (!/^\S+@\S+\.\S+$/.test(value)) setEmailError("Invalid email format");
    else setEmailError("");
  };

  // SEND OTP
  const sendOtp = () => {
    if (emailError || !email) return;

    const genOtp = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem("email_otp", genOtp);

    emailjs.send(
      "YOUR_SERVICE_ID",
      "YOUR_TEMPLATE_ID",
      { otp: genOtp, email: email },
      "YOUR_PUBLIC_KEY"
    );

    setOtpSent(true);
    alert("OTP sent to: " + email);
  };

  // VERIFY OTP
  const verifyOtp = () => {
    const storedOtp = localStorage.getItem("email_otp");
    if (otp === storedOtp) {
      setVerified(true);
      alert("Email Verified!");
      localStorage.removeItem("email_otp");
    } else {
      alert("Invalid OTP!");
    }
  };

  // HANDLE FORM SUBMIT
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verified) {
      alert("Please verify your email first!");
      return;
    }
    if (!agreeTerms) {
      alert("You must agree to Terms & Conditions!");
      return;
    }

    console.log({
      firstName,
      lastName,
      company,
      service,
      businessStatus,
      country,
      phone,
      email,
      message,
      files,
      agreeMarketing,
    });
    alert("Form submitted!");
  };

  const toggleService = (value: string) => {
    setService((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  return (
    <form
      className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow-md space-y-6"
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
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First Name*"
          className="w-full h-12 border border-black rounded-[10px] px-3"
          required
        />
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last Name*"
          className="w-full h-12 border border-black rounded-[10px] px-3"
          required
        />
      </div>

      {/* Email + OTP */}
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => validateEmail(e.target.value)}
          placeholder="Email*"
          className={`w-full border h-12 px-3 py-2 rounded-[10px] ${emailError ? "border-red-500" : ""}`}
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
      <input
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        placeholder="Company Name*"
        className="w-full h-12 border border-black rounded-[10px] px-3"
        required
      />

      {/* Service checkboxes */}
      <div className="flex flex-col gap-1">
        <label className="font-medium">How can we help you?*</label>
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

      {/* Business Status */}
      <select
        value={businessStatus}
        onChange={(e) => setBusinessStatus(e.target.value)}
        className="w-full h-12 border border-black rounded-[10px] px-3"
        required
      >
        <option value="">Select Business Status</option>
        <option value="In the business">In the business</option>
        <option value="Startup">Startup</option>
        <option value="Other">Other</option>
      </select>

      {/* Country */}
      <select
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        className="w-full h-12 border border-black rounded-[10px] px-3"
        required
      >
        <option value="">Select Country</option>
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Phone */}
      <PhoneInput
        country={country.toLowerCase()}
        value={phone ?? ""}
        onChange={setPhone}
        placeholder="Phone number"
        className="w-full h-12 border border-black rounded-[10px] px-3"
      />

      {/* Message */}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Message"
        className="w-full border border-black rounded-[10px] px-3 py-2"
      />

      {/* File Upload Button */}
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
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            required
          />{" "}
          I understand that Royi Sal Jewelry team will use my data to contact me. Read Terms & Conditions
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

      <button type="submit" className="w-full bg-black text-white py-2 rounded-lg">
        Submit
      </button>
    </form>
  );
}
