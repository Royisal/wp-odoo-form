import { useState, useEffect } from "react";
// import { createPortal } from "react-dom";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { getCountries, isSupportedCountry } from "libphonenumber-js";

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
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [utm, setUtm] = useState({
    source: "",
    medium: "",
    campaign: "",
    term: "",
    content: "",
  });

  
  useEffect(() => {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);

    const utmData = {
      source: params.get("utm_source") || "",
      medium: params.get("utm_medium") || "",
      campaign: params.get("utm_campaign") || "",
      term: params.get("utm_term") || "",
      content: params.get("utm_content") || "",
    };

    setUtm(utmData);

    console.log("📌 UTM Captured:", utmData);
  }
}, []);


  // Track form submission success
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Toast message state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

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

  // Show toast and auto-hide after 2 seconds
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2000);
  };

  // Countdown for OTP resend
  useEffect(() => {
    if (otpTimer <= 0) return;
    const id = setInterval(() => {
      setOtpTimer((t) => (t > 1 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [otpTimer]);

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
        // console.log(isSupportedCountry(country),'is supported');
        
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
      const res = await fetch("https://odoo.royisal.com/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!data.success) {
        showToast(data.error || "Failed to send OTP", "error");
        return;
      }
      showToast("OTP sent! Check your email.", "success");
      // Store OTP in localStorage
      localStorage.setItem(
        "email_otp",
        JSON.stringify({ code: data.otp, expires: Date.now() + 5 * 60 * 1000 })
      );

      setOtpSent(true);
      setOtpTimer(30);
      
    } catch (err) {
      console.error(err);
      showToast("Network error! Please try again.", "error");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // VERIFY OTP
  const verifyOtp = () => {
    const stored = localStorage.getItem("email_otp");

    if (!stored) {
      showToast("No OTP stored — request again", "error");
      return;
    }

    const { code, expires } = JSON.parse(stored);

    if (Date.now() > expires) {
      showToast("OTP expired, please resend", "error");
      localStorage.removeItem("email_otp");
      return;
    }

    if (otp === code) {
      setVerified(true);
      localStorage.removeItem("email_otp");
      showToast("Email verified!", "success");
    } else {
      showToast("Invalid OTP!", "error");
    }
  };

  // HANDLE FORM SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verified) {
      alert("Please verify your email first!");
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
      fd.append("agreeTerms", "true"); // Always true since form can't be submitted without verification
      fd.append("agreeMarketing", agreeMarketing ? "true" : "false");

      // attach page url and title
      fd.append("pageUrl", pageUrl);
      fd.append("pageTitle", pageTitle);
      fd.append("utm_source", utm.source);
      fd.append("utm_medium", utm.medium);
      fd.append("utm_campaign", utm.campaign);
      fd.append("utm_term", utm.term);
      fd.append("utm_content", utm.content);


      service.forEach((s) => fd.append("service[]", s));
      files.forEach((file) => fd.append("files", file));

      return fd;
    };

    setIsSubmitting(true);
    try {
      const formLead = buildFormData();
      await fetch("https://odoo.royisal.com/add-lead", {
        method: "POST",
        body: formLead,
      });

     // Hide form and show thank you message
     setFormSubmitted(true);

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
      alert("❌ Failed, please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleService = (value: string) => {
    setService((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  // If form is submitted, show thank you message
  if (formSubmitted) {
    return (
      <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-md text-center space-y-6" style={{ fontFamily: "'Kanit', sans-serif" }}>
        <h2 className="text-2xl md:text-3xl font-bold text-[#a50019]">
          Thank you for reaching out to us!
        </h2>
        <p className="text-base md:text-lg">
          Your inquiry matters, and our team will be in touch within 24 hours.
        </p>

        <div className="space-y-4">
          <p className="font-semibold">In the meantime, you can:</p>
          <ul className="space-y-2 text-left list-disc list-inside">
            <li>
              <a href="https://www.linkedin.com/company/royi-sal-jewelry" target="_blank" rel="noopener noreferrer" className="text-[#a50019] hover:underline">
                Connect with us on LinkedIn
              </a>
            </li>
            <li>
              <a href="https://www.facebook.com/royisaljewelry" target="_blank" rel="noopener noreferrer" className="text-[#a50019] hover:underline">
                Message us on Facebook
              </a>
            </li>
            <li>
              <a href="https://www.instagram.com/royisaljewelry/" target="_blank" rel="noopener noreferrer" className="text-[#a50019] hover:underline">
                Follow us on Instagram
              </a>
            </li>
          </ul>
        </div>

        <p className="text-sm md:text-base">
          We'd also love your feedback. Please take a moment to fill out our short{" "}
          <a href="https://royisal.com/feedback" target="_blank" rel="noopener noreferrer" className="text-[#a50019] hover:underline font-semibold">
            Feedback Form
          </a>
          . It's completely anonymous and helps us improve the way we support you.
        </p>

        <p className="text-base md:text-lg font-semibold mt-6">
          Wishing you a wonderful day,<br />
          <span className="text-[#a50019]">The Royi Sal Team</span>
        </p>
      </div>
    );
  }

  return (
    <>
    {/* Toast notification */}
    {toast && (
      <div
        className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-[10000] transition-opacity ${
          toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
        }`}
      >
        {toast.message}
      </div>
    )}
    
    <form
      className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow-md space-y-6 text-sm md:text-base"
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
        <label className="font-medium text-sm md:text-base" style={{ fontWeight: 400 }}>First name*</label>
        <input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First Name"
          className="w-full h-12 border border-black rounded-[10px] px-3 text-sm md:text-base"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-medium text-sm md:text-base" style={{ fontWeight: 400 }}>Last Name*</label>
        <input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last Name"
          className="w-full h-12 border border-black rounded-[10px] px-3 text-sm md:text-base"
          required
        />
      </div>

      {/* Email + OTP */}
      <div>
        <label className="font-medium text-sm md:text-base" style={{ fontWeight: 400 }}>Email*</label>
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
        <label className="font-medium text-sm md:text-base" style={{ fontWeight: 400 }}>Company Name*</label>
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Company Name"
          className="w-full h-12 border border-black rounded-[10px] px-3 mt-2 text-sm md:text-base"
          required
        />
      </div>

      {/* Service checkboxes */}
      <div className="flex flex-col gap-2">
        <label className="font-medium text-sm md:text-base" style={{ fontWeight: 400 }}>How can we help you?*</label>
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
        <label className="font-medium text-sm md:text-base" style={{ fontWeight: 400 }}>Business Status*</label>
        <select
          value={businessStatus}
          onChange={(e) => setBusinessStatus(e.target.value)}
          className="w-full h-12 border border-black rounded-[10px] px-3 mt-2"
          required
        >
          <option value="">Select Business Status</option>
          <option value="In the business">In the business</option>
          <option value="Start Up">Start up</option>
          <option value="Concept Stage">Concept Stage</option>
        </select>
      </div>

      {/* Country */}
      <div>
        <label className="font-medium text-sm md:text-base" style={{ fontWeight: 400 }}>Country*</label>
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
        <label className="font-medium text-sm md:text-base" style={{ fontWeight: 400 }}>Phone*</label>
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
      <label className="font-medium text-sm md:text-base" style={{ fontWeight: 400 }}>Upload Images <br /> (e.g., concept art, designs, inspirations)</label>
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
    </form>

    {/* {modal.open &&
      createPortal(
        <div 
         className="flex items-center justify-center bg-black bg-opacity-50 z-[9999] p-4"
         style={{ 
           position: 'fixed',
           top: 0,
           left: 0,
           width: '100vw',
           height: '100vh',
           margin: 0
         }}
        >
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md text-center">
            <h2 className={`text-lg font-bold mb-4 ${modal.type === "error" ? "text-red-600" : "text-green-600"}`}>
              {modal.type === "error" ? "Error" : "Success"}
            </h2>
            <p className="mb-4 text-sm md:text-base">{modal.message}</p>
            <button
              className="px-4 py-2 bg-[#a50019] text-white rounded-lg hover:bg-[#8f0016] hover:cursor-pointer"
              onClick={() => setModal({ ...modal, open: false })}
            >
              Close
            </button>
          </div>
        </div>,
        // If in iframe, try to render in parent window; otherwise use current document
        (window.parent !== window ? window.parent.document.body : document.body)
      )} */}
    </>
  );
}
