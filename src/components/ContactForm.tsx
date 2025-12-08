import { useState, useEffect } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { getCountries, getCountryCallingCode, isSupportedCountry } from "libphonenumber-js";

export default function ContactForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [service, setService] = useState<string[]>([]);
  const [businessStatus, setBusinessStatus] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState<string | undefined>();
  // phoneCountry mirrors the select-driven country for PhoneInput (lowercase or undefined)
  const [phoneCountry, setPhoneCountry] = useState<string | undefined>();
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
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // NEW: loading states for API actions
  const [otpTimer, setOtpTimer] = useState(0);

  // Get page URL and title
  const [pageUrl, setPageUrl] = useState("");
  const [pageTitle, setPageTitle] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPageUrl(window.location.href);
      setPageTitle(document.title || "");
    }
  }, []);

  // keep phoneCountry in sync with the country select (PhoneInput expects lower-case)
  useEffect(() => {
    if (country) {
      if (isSupportedCountry(country)) {
        console.log(isSupportedCountry(country),'is supported');
        
        setPhoneCountry(country.toLowerCase());
      } else {
        console.error("Invalid country code:", country);
        setPhoneCountry(undefined);
      }
    } else {
      setPhoneCountry(undefined);
    }
  }, [country]);

  // Update phone input with country code when country is selected
  useEffect(() => {
    if (country) {
      if (isSupportedCountry(country)) {
        // const dialCode = getCountryCallingCode(country as any);
        // setPhone(`+${dialCode}`);
      } else {
        setPhone("");
      }
    } else {
      setPhone("");
    }
  }, [country]);

  // COUNTRY + CODE
  const phoneCountries = getCountries()
    .filter((code) => isSupportedCountry(code))
    .map((code) => ({
      code,
      name: new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code,
    }));

  // Sort alphabetically
  const sortedCountries = phoneCountries.sort((a, b) => a.name.localeCompare(b.name));

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

    setIsSendingOtp(true);
    try {
      const res = await fetch("http://localhost:8871/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!data.success) {
        setModal({ open: true, message: data.error || "Failed to send OTP", type: "error" });
        return;
      }
      setModal({
        open: true,
        message: "OTP sent! Check your email inbox, spam folder, or Promotions tab for the email.",
        type: "success",
      });
      // Store OTP in localStorage
      localStorage.setItem(
        "email_otp",
        JSON.stringify({ code: data.otp, expires: Date.now() + 5 * 60 * 1000 })
      );

      setOtpSent(true);
      setOtpTimer(30);
      
    } catch (err) {
      console.error(err);
      
    } finally {
      setIsSendingOtp(false);
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

    const buildFormData = () => {
      const fd = new FormData();
      fd.append("firstName", firstName);
      fd.append("lastName", lastName);
      fd.append("name", `${firstName} ${lastName}`);
      fd.append("email", email);
      // phone: PhoneInput returns the full phone with country code
      fd.append("phone", phone ?? "");
      fd.append("company", company || "");
      fd.append("businessStatus", businessStatus);
      fd.append("country", country);
      fd.append("message", message || "");
      fd.append("agreeTerms", agreeTerms ? "true" : "false");
      fd.append("agreeMarketing", agreeMarketing ? "true" : "false");

      // attach page url and title
      fd.append("pageUrl", pageUrl);
      fd.append("pageTitle", pageTitle);

      service.forEach((s) => fd.append("service[]", s));
      files.forEach((file) => fd.append("files", file));

      return fd;
    };

    setIsSubmitting(true);
    try {
      const formLead = buildFormData();
      await fetch("http://localhost:8871/add-lead", {
        method: "POST",
        body: formLead,
      });

      setModal({
        open: true,
        message: "✔ Message sent & CRM lead created! Check your email inbox, spam folder, or Promotions tab for the email.",
        type: "success",
      });

     // Check if page title contains "gothic" and redirect after 2.5 seconds
     const titleLower = pageTitle.toLowerCase();
     if (titleLower.includes("gothic")) {
       setTimeout(() => {
         // Redirect to gothic page (adjust URL as needed)
         window.location.href = "/gothic";
       }, 2500);
     }
    } catch (err) {
      console.error(err);
      setModal({ open: true, message: "❌ Failed, please try again", type: "error" });
    } finally {
      setIsSubmitting(false);
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
                disabled={isSendingOtp}
                className={`w-full py-2 rounded-lg text-white ${
                  isSendingOtp
                    ? "bg-[#8f0016] opacity-70 cursor-not-allowed"
                    : "bg-[#a50019] hover:bg-[#8f0016] hover:cursor-pointer"
                }`}
              >
                {isSendingOtp ? "Sending..." : "Send OTP"}
              </button>
            ) : (
              <>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="w-full border px-3 py-2 rounded-lg mt-2"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={verifyOtp}
                    disabled={isSendingOtp}
                    className={`flex-1 bg-[#a50019] text-white py-2 rounded-lg ${
                      isSendingOtp ? "opacity-60 cursor-not-allowed" : "hover:bg-[#8f0016] hover:cursor-pointer"
                    }`}
                  >
                    Verify OTP
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (isSendingOtp || otpTimer > 0) return;
                      // clear current otp input when resending
                      setOtp("");
                      sendOtp();
                    }}
                    disabled={otpTimer > 0 || isSendingOtp}
                    className={`flex-1 py-2 rounded-lg text-white ${
                      otpTimer > 0 || isSendingOtp
                        ? "bg-gray-400 cursor-not-allowed opacity-70"
                        : "bg-[#a50019] hover:bg-[#8f0016] hover:cursor-pointer"
                    }`}
                  >
                    {isSendingOtp ? "Sending..." : otpTimer > 0 ? `Resend OTP (${otpTimer}s)` : "Resend OTP"}
                  </button>
                </div>
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
          {sortedCountries.map((c) => (
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
            defaultCountry={phoneCountry as any}
            country={phoneCountry ? (phoneCountry as any) : undefined}
            value={phone ?? ""}
            onChange={(val) => setPhone(val)}
            onCountryChange={(c) => {
              if (c) {
                if (isSupportedCountry(c)) {
                  setPhoneCountry(c);
                  setCountry(c.toUpperCase());
                } else {
                  console.error("Invalid country from PhoneInput:", c);
                }
              } else {
                setPhoneCountry(undefined);
                setCountry("");
              }
            }}
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
        disabled={!verified || isSubmitting}
        className={`w-full py-2 rounded-lg ${
          !verified || isSubmitting
            ? "bg-gray-400 cursor-not-allowed text-white opacity-70"
            : "bg-[#a50019] text-white hover:bg-[#8f0016] hover:cursor-pointer"
        }`}
      >
        {isSubmitting ? "Submitting..." : "Submit"}
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
