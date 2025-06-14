import React, { useState, useEffect, useCallback, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, Auth } from "firebase/auth"; // Import Auth type and onAuthStateChanged
import { getFirestore, doc, setDoc, onSnapshot, Firestore } from "firebase/firestore"; // Import Firestore type

// Declare html2canvas on the Window object for TypeScript
declare global {
  interface Window {
    html2canvas: any; // html2canvas is loaded dynamically, so 'any' is practical here
  }
}

// Define interface for stampedBooths (only for tracking boolean status)
interface StampedBooths {
  [key: string]: boolean | undefined; // Allow string keys, and their values can be boolean or undefined
}

// Define interface for customStampImages (which hold URLs, not booleans)
interface CustomStampImageMap {
  [key: string]: string | undefined; // Keys are booth IDs, values are string URLs
  nadia: string;
  hiredScore: string;
  serviceNow: string;
  workday: string;
  yearEndChatbot: string;
  copilotM365: string;
  analystAgent: string;
  researchAgent: string;
  deloitteBooth: string;
  digitalPassportCreation: string;
}

const App = () => {
  // Firebase state variables with explicit types
  const [db, setDb] = useState<Firestore | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isPassportDataLoaded, setIsPassportDataLoaded] = useState(false);
  const [html2canvasLoaded, setHtml2canvasLoaded] = useState(false);

  // Passport state variables
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [favoriteSessions, setFavoriteSessions] = useState<string[]>([]); // Explicitly string array
  const [stampedBooths, setStampedBooths] = useState<StampedBooths>({}); // Use StampedBooths interface
  // New state variables for free text fields
  const [favoriteGenAITool, setFavoriteGenAITool] = useState("");
  const [keyInsights, setKeyInsights] = useState("");

  // Ref for the passport display section to capture it as an image
  const passportRef = useRef<HTMLDivElement>(null); // Explicitly type useRef

  // Static passport details
  const passportIssuedDate = "June 19, 2025";
  const passportPlace = "AImplify III workshop, Zurich";
  const passportValidUntil = "Till you continue to use Copilot and AI";

  // Novartis Brand Colors
  const colors = {
    darkBlue: "#002068",
    mediumBlue: "#0460A9",
    redAccent: "#FF585D",
    yellowAccent: "#FFC100",
    lightBlueBg: "#E0F2F7",
    lightRedBg: "#FFF2F2",
    greenStamp: "#4CAF50",
    greenStampLight: "#E8F5E9",
  };

  // --- Avatar image URLs ---
  const baseRepoUrl =
    "https://raw.githubusercontent.com/AparnaVadlamudi/avatars_and_stamps/main/";
  const avatarImages = Array.from(
    { length: 35 },
    (_, i) => `${baseRepoUrl}avatar_${i + 1}.png`
  );

  // --- Stamp image URLs ---
  // Now correctly typed as CustomStampImageMap, containing string URLs
  const customStampImages: CustomStampImageMap = {
    nadia: `${baseRepoUrl}stamp_nadia.png`,
    hiredScore: `${baseRepoUrl}stamp_hiredscore.png`,
    serviceNow: `${baseRepoUrl}stamp_servicenow.png`,
    workday: `${baseRepoUrl}stamp_workday.png`,
    yearEndChatbot: `${baseRepoUrl}stamp_YEbot.png`,
    copilotM365: `${baseRepoUrl}stamp_copilot_o365.png`,
    analystAgent: `${baseRepoUrl}stamp_copilot_analyst_agent.png`,
    researchAgent: `${baseRepoUrl}stamp_copilot_research_agent.png`,
    deloitteBooth: `${baseRepoUrl}stamp_deloitte.png`,
    digitalPassportCreation: `${baseRepoUrl}stamp_digital_passport.png`,
  };

  // Specific Booths for stamping (from Day 1 and Day 2)
  const boothOptions = [
    { id: "nadia", name: "Nadia" },
    { id: "hiredScore", name: "HiredScore" },
    { id: "serviceNow", name: "ServiceNow" },
    { id: "workday", name: "Workday" },
    { id: "yearEndChatbot", name: "Year End Rewards Assistant" },
    { id: "copilotM365", name: "Copilot for M365" },
    { id: "analystAgent", name: "Copilot Analyst Agent" },
    { id: "researchAgent", name: "Copilot Research Agent" },
    { id: "deloitteBooth", name: "Deloitte" },
    { id: "digitalPassportCreation", name: "Digital Passport Creation" },
  ];

  // Favorite Sessions/Activities from the agenda
  const favoriteOptions = [
    {
      id: "externalSpeaker",
      name: "External Speaker: AI - The Art of the Possible",
    },
    {
      id: "interactiveShowcaseD1",
      name: "Interactive Showcase: AI Solutions in Action (Day 1)",
    },
    {
      id: "interactiveShowcaseD2",
      name: "Interactive Showcase: Upskilling in Action (Day 2)",
    },
    { id: "aiUseCases", name: "AI Use Case Pipeline" },
    { id: "firesideChat", name: "AI in P&O Industry Insights" },
    {
      id: "governance",
      name: "Governance: Driving Responsible Innovation in P&O",
    },
    { id: "upskilling", name: "Upskilling for the AI-Powered P&O" },
    {
      id: "scalingAI",
      name: "From Pilots to Products: Scaling AI Initiatives & Building AI Powered P&O Ecosystem",
    },
  ];

  // Initialize Firebase and set up authentication
  useEffect(() => {
    try {
      const firebaseConfig = {
        apiKey: "AIzaSyDo3etrqLKSSzFMcExk-TOJD30MQm82Qo8",
        authDomain: "aimplify-iii-digital-passport.firebaseapp.com",
        projectId: "aimplify-iii-digital-passport",
        storageBucket: "aimplify-iii-digital-passport.firebasestorage.app",
        messagingSenderId: "889222817126",
        appId: "1:889222817126:web:d5fff92dc3cc3bd5d094a7",
        measurementId: "G-2NZ85VDZVN",
      };

      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const firebaseAuth = getAuth(app);

      setDb(firestore);
      setAuth(firebaseAuth);

      onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          setUserId(user.uid);
          setMessage(`Signed in as: ${user.uid}`);
        } else {
          setMessage("Signing in anonymously...");
          try {
            await signInAnonymously(firebaseAuth);
            setMessage("Signed in anonymously.");
          } catch (error: unknown) { // Explicitly type error as unknown
            console.error("Error signing in:", error);
            if (error instanceof Error) { // Type guard for Error instance
              setMessage(
                `Authentication error: ${error.message}. Please ensure Firebase Authentication is enabled AND 'Anonymous' sign-in method is enabled in your Firebase project console under Build -> Authentication.`
              );
            } else {
              setMessage(`Authentication error: An unknown error occurred.`);
            }
          }
        }
        setIsAuthReady(true);
      });
    } catch (error: unknown) { // Explicitly type error as unknown
      console.error("Firebase initialization failed:", error);
      if (error instanceof Error) { // Type guard for Error instance
        setMessage(
          `Firebase init error: ${error.message}. Please check your Firebase config.`
        );
      } else {
        setMessage(`Firebase init error: An unknown error occurred.`);
      }
      setLoading(false);
    }
  }, []);

  // Load passport data from Firestore when auth is ready and userId is set
  useEffect(() => {
    const currentAppId = auth?.app?.options?.projectId || "default-app-id"; // Use optional chaining

    if (isAuthReady && db && userId) {
      const userPassportRef = doc(
        db,
        `artifacts/${currentAppId}/users/${userId}/passports`,
        "myPassport"
      );

      const unsubscribe = onSnapshot(
        userPassportRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserName(data.userName || "");
            setUserRole(data.userRole || "");
            setSelectedAvatar(data.selectedAvatar || avatarImages[0]);
            setFavoriteSessions(data.favoriteSessions || []);

            const loadedStampedBooths: StampedBooths = data.stampedBooths || {};
            const newStampedBooths: StampedBooths = { ...loadedStampedBooths };

            // Migration logic for old copilot stamps
            if (
              loadedStampedBooths.copilotWord ||
              loadedStampedBooths.copilotPowerPoint ||
              loadedStampedBooths.copilotChat
            ) {
              newStampedBooths.copilotM365 = true;
              delete newStampedBooths.copilotWord;
              delete newStampedBooths.copilotPowerPoint;
              delete newStampedBooths.copilotChat;
            }
            // Migration logic for funBooth
            if (loadedStampedBooths.funBooth) {
              newStampedBooths.digitalPassportCreation = true;
              delete newStampedBooths.funBooth;
            }
            setStampedBooths(newStampedBooths);

            setFavoriteGenAITool(data.favoriteGenAITool || "");
            setKeyInsights(data.keyInsights || "");
            setMessage("Passport data loaded!");
          } else {
            setMessage("No passport data found, initializing new one.");
            setUserName("");
            setUserRole("");
            setSelectedAvatar(avatarImages[0]);
            setFavoriteSessions([]);
            setStampedBooths({});
            setFavoriteGenAITool("");
            setKeyInsights("");
          }
          setIsPassportDataLoaded(true);
        },
        (error) => {
          console.error("Error fetching passport data:", error);
          if (error instanceof Error) {
            setMessage(`Error loading passport: ${error.message}`);
          } else {
            setMessage(`Error loading passport: An unknown error occurred.`);
          }
          setIsPassportDataLoaded(true);
        }
      );

      return () => unsubscribe();
    } else if (isAuthReady && !userId && !loading) {
      setIsPassportDataLoaded(true);
      setMessage(
        "User ID not yet available for data loading. Will try again once authenticated."
      );
    }
  }, [isAuthReady, db, userId, avatarImages, loading, auth]);

  // Dynamically load html2canvas script
  useEffect(() => {
    const scriptId = "html2canvas-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      script.onload = () => {
        setHtml2canvasLoaded(true);
        setMessage("html2canvas loaded successfully.");
      };
      script.onerror = () => {
        console.error("Failed to load html2canvas script.");
        setMessage("Error loading html2canvas. Download feature may not work.");
      };
      document.body.appendChild(script);
    } else {
      setHtml2canvasLoaded(true);
    }
  }, []);

  // Set overall loading state once both auth, passport data, AND html2canvas are ready
  useEffect(() => {
    if (isAuthReady && isPassportDataLoaded && html2canvasLoaded) {
      setLoading(false);
    }
  }, [isAuthReady, isPassportDataLoaded, html2canvasLoaded]);

  // Save passport data to Firestore
  const savePassportData = useCallback(async () => {
    if (!db || !userId) {
      setMessage("Authentication not ready or user ID missing. Cannot save.");
      return;
    }
    try {
      const stampedBoothsToSave: StampedBooths = { ...stampedBooths }; // Explicitly type

      if (stampedBoothsToSave.copilotM365) {
        delete stampedBoothsToSave.copilotWord;
        delete stampedBoothsToSave.copilotPowerPoint;
        delete stampedBoothsToSave.copilotChat;
      }
      if (stampedBoothsToSave.digitalPassportCreation) {
        delete stampedBoothsToSave.funBooth;
      }

      const currentAppId = auth?.app?.options?.projectId; // Use optional chaining

      if (!currentAppId) { // Add a check for currentAppId
        setMessage("App ID is missing, cannot save passport data.");
        return;
      }

      await setDoc(
        doc(
          db,
          `artifacts/${currentAppId}/users/${userId}/passports`,
          "myPassport"
        ),
        {
          userName,
          userRole,
          selectedAvatar,
          favoriteSessions,
          stampedBooths: stampedBoothsToSave,
          favoriteGenAITool,
          keyInsights,
          lastUpdated: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error: unknown) { // Explicitly type error as unknown
      console.error("Error saving passport data:", error);
      if (error instanceof Error) {
        setMessage(`Error saving passport: ${error.message}`);
      } else {
        setMessage(`Error saving passport: An unknown error occurred.`);
      }
    }
  }, [
    db,
    userId,
    userName,
    userRole,
    selectedAvatar,
    favoriteSessions,
    stampedBooths,
    favoriteGenAITool,
    keyInsights,
    auth,
  ]);

  // Handle changes to user input fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter(e.target.value);
  };

  // Handle favorite session selection
  const handleFavoriteSessionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFavoriteSessions((prev: string[]) => { // Explicitly type prev as string[]
      if (checked) {
        return [...prev, value];
      } else {
        return prev.filter((session) => session !== value);
      }
    });
  };

  // Handle stamping a booth
  const handleStampBooth = (boothId: string) => { // Explicitly type boothId as string
    setStampedBooths((prev: StampedBooths) => ({ // Explicitly type prev as StampedBooths
      ...prev,
      [boothId]: !prev[boothId],
    }));
  };

  // Function to download the passport as an image
  const handleDownloadPassport = async () => {
    if (!html2canvasLoaded || typeof window.html2canvas === "undefined") {
      setMessage(
        "html2canvas library is not loaded. Please try again in a moment, or refresh."
      );
      return;
    }
    if (!passportRef.current) {
      setMessage("Error: Passport element not found for download.");
      return;
    }
    setMessage("Generating passport image...");
    try {
      const canvas = await window.html2canvas(passportRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `${userName || "AImplify"}_Passport.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setMessage("Passport downloaded successfully!");
    } catch (error: unknown) { // Explicitly type error as unknown
      console.error("Error generating or downloading passport image:", error);
      if (error instanceof Error) {
        setMessage(
          `Error downloading passport: ${error.message}. Make sure images are publicly accessible.`
        );
      } else {
        setMessage(`Error downloading passport: An unknown error occurred.`);
      }
    }
  };

  // Save data whenever relevant state changes, after initial load is complete
  useEffect(() => {
    if (!loading && isAuthReady && db && userId) {
      savePassportData();
    }
  }, [
    userName,
    userRole,
    selectedAvatar,
    favoriteSessions,
    stampedBooths,
    favoriteGenAITool,
    keyInsights,
    loading,
    isAuthReady,
    db,
    userId,
    savePassportData,
  ]);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-gray-100 p-4"
        style={{ backgroundColor: colors.lightBlueBg }}
      >
        <div className="text-xl font-semibold text-gray-700">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2"
            style={{ borderColor: colors.darkBlue }}
          ></div>
          <p className="mt-4" style={{ color: colors.darkBlue }}>
            Loading Digital Passport...
          </p>
          {message && <p className="text-sm text-gray-500 mt-2">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-4 font-sans flex items-center justify-center"
      style={{
        background: `linear-gradient(to bottom right, ${colors.lightBlueBg}, ${colors.mediumBlue})`,
      }}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl w-full border-4 overflow-hidden"
        style={{ borderColor: colors.darkBlue }}
      >
        <h1
          className="text-4xl font-extrabold text-center mb-8 mt-4 rounded-xl py-2"
          style={{ color: colors.darkBlue, backgroundColor: colors.lightRedBg }}
        >
          AImplify III Digital Passport
        </h1>

        {userId && (
          <div className="text-center text-gray-600 mb-6 text-sm">
            <p>
              Your unique Passport ID:{" "}
              <span
                className="font-mono text-xs px-2 py-1 rounded-md"
                style={{
                  backgroundColor: colors.lightBlueBg,
                  color: colors.darkBlue,
                }}
              >
                {userId}
              </span>
            </p>
          </div>
        )}

        {message && (
          <div
            className="border text-blue-700 px-4 py-3 rounded-md relative mb-6"
            role="alert"
            style={{
              backgroundColor: colors.lightBlueBg,
              borderColor: colors.mediumBlue,
              color: colors.darkBlue,
            }}
          >
            <span className="block sm:inline">{message}</span>
          </div>
        )}

        <div className="space-y-8">
          {/* Passport Details & Avatar Section */}
          <div
            className="p-6 rounded-2xl border"
            style={{
              backgroundColor: colors.lightBlueBg,
              borderColor: colors.mediumBlue,
            }}
          >
            <h2
              className="text-2xl font-bold mb-4 flex items-center"
              style={{ color: colors.darkBlue }}
            >
              <span className="mr-2 text-3xl">🎫</span> Your Digital Identity
            </h2>

            <div className="mb-4">
              <label
                htmlFor="userName"
                className="block text-sm font-semibold mb-2"
                style={{ color: colors.darkBlue }}
              >
                Your Name:
              </label>
              <input
                type="text"
                id="userName"
                value={userName}
                onChange={(e) => handleInputChange(e, setUserName)}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition duration-200 ease-in-out shadow-sm"
                style={{
                  borderColor: colors.mediumBlue,
                  color: colors.darkBlue,
                }} // Removed focusRingColor
                placeholder="Enter your name"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="userRole"
                className="block text-sm font-semibold mb-2"
                style={{ color: colors.darkBlue }}
              >
                Your Role:
              </label>
              <input
                type="text"
                id="userRole"
                value={userRole}
                onChange={(e) => handleInputChange(e, setUserRole)}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition duration-200 ease-in-out shadow-sm"
                style={{
                  borderColor: colors.mediumBlue,
                  color: colors.darkBlue,
                }} // Removed focusRingColor
                placeholder="e.g., P&O Business Partner"
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="avatarSelector"
                className="block text-sm font-semibold mb-2"
                style={{ color: colors.darkBlue }}
              >
                Choose your avatar:
              </label>
              <div className="flex flex-wrap gap-2 justify-center">
                {avatarImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAvatar(image)}
                    className={`w-16 h-16 p-1 rounded-full border-2 transition duration-300 ease-in-out transform hover:scale-110 overflow-hidden flex justify-center items-center
                                 ${selectedAvatar === image ? "ring-2 ring-offset-2" : ""}`} // Add ring-offset for better visibility
                    style={{
                      borderColor:
                        selectedAvatar === image
                          ? colors.redAccent
                          : "transparent",
                    }} // Removed ringColor
                  >
                    <img
                      src={image}
                      alt={`Avatar ${index + 1}`}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { // Explicitly type e
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src =
                          "https://placehold.co/64x64/cccccc/000000?text=Err";
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* New fields */}
            <div className="mb-4">
              <label
                htmlFor="favoriteGenAITool"
                className="block text-sm font-semibold mb-2"
                style={{ color: colors.darkBlue }}
              >
                My Favorite Gen AI Tool:
              </label>
              <input
                type="text"
                id="favoriteGenAITool"
                value={favoriteGenAITool}
                onChange={(e) => handleInputChange(e, setFavoriteGenAITool)}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition duration-200 ease-in-out shadow-sm"
                style={{
                  borderColor: colors.mediumBlue,
                  color: colors.darkBlue,
                }} // Removed focusRingColor
                placeholder="e.g., Gemini, ChatGPT, Microsoft Copilot, Midjourney"
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="keyInsights"
                className="block text-sm font-semibold mb-2"
                style={{ color: colors.darkBlue }}
              >
                My Key Insights from AImplify III:
              </label>
              <textarea
                id="keyInsights"
                value={keyInsights}
                onChange={(e) => handleInputChange(e, setKeyInsights)}
                rows={3} // Changed to number type
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 transition duration-200 ease-in-out shadow-sm"
                style={{
                  borderColor: colors.mediumBlue,
                  color: colors.darkBlue,
                  resize: "vertical",
                }} // Removed focusRingColor
                placeholder="Share your key takeaways..."
              ></textarea>
            </div>

            <div
              className="text-lg p-4 rounded-xl shadow-inner border"
              style={{
                backgroundColor: "#ffffff",
                borderColor: colors.mediumBlue,
                color: colors.darkBlue,
              }}
            >
              <p
                className="font-semibold mb-2 flex items-center"
                style={{ color: colors.mediumBlue }}
              >
                <span className="text-xl mr-2">📅</span>Issued On:{" "}
                <span
                  className="ml-2 font-normal"
                  style={{ color: colors.darkBlue }}
                >
                  {passportIssuedDate}
                </span>
              </p>
              <p
                className="font-semibold mb-2 flex items-center"
                style={{ color: colors.mediumBlue }}
              >
                <span className="text-xl mr-2">📍</span>Place:{" "}
                <span
                  className="ml-2 font-normal"
                  style={{ color: colors.darkBlue }}
                >
                  {passportPlace}
                </span>
              </p>
              <p
                className="font-semibold flex items-center"
                style={{ color: colors.mediumBlue }}
              >
                <span className="text-xl mr-2">✅</span>Valid Until:{" "}
                <span
                  className="ml-2 font-normal"
                  style={{ color: colors.darkBlue }}
                >
                  {passportValidUntil}
                </span>
              </p>
            </div>

            <div className="mt-6">
              <p
                className="block text-sm font-semibold mb-2"
                style={{ color: colors.darkBlue }}
              >
                Your Favorite Sessions/Activities (select all that apply):
              </p>
              <div className="flex flex-wrap gap-4">
                {favoriteOptions.map((option) => (
                  <label
                    key={option.id}
                    className="inline-flex items-center cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      value={option.id}
                      checked={favoriteSessions.includes(option.id)}
                      onChange={handleFavoriteSessionChange}
                      className="form-checkbox h-5 w-5 rounded-md focus:ring-2"
                      style={{
                        color: colors.redAccent,
                        accentColor: colors.redAccent,
                      }} // Removed focusRingColor
                    />
                    <span
                      className="ml-2 text-md font-medium"
                      style={{ color: colors.darkBlue }}
                    >
                      {option.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Booths & Stamps Section */}
          <div
            className="p-6 rounded-2xl border shadow-lg"
            style={{ backgroundColor: "#ffffff", borderColor: colors.darkBlue }}
          >
            <h2
              className="text-2xl font-bold mb-4 flex items-center"
              style={{ color: colors.darkBlue }}
            >
              <span className="mr-2 text-3xl">🎯</span> Workshop Booths & Stamps
            </h2>
            <p className="mb-6" style={{ color: colors.darkBlue }}>
              Visit each booth and get your digital stamp!
            </p>

            <div className="space-y-4">
              {boothOptions.map((booth) => (
                <div
                  key={booth.id}
                  className="flex items-center justify-between p-4 rounded-xl shadow-sm border"
                  style={{
                    backgroundColor: colors.lightRedBg,
                    borderColor: colors.redAccent,
                  }}
                >
                  <span
                    className={`text-lg font-medium ${
                      stampedBooths[booth.id] ? "line-through" : ""
                    }`}
                    style={{
                      color: stampedBooths[booth.id]
                        ? colors.mediumBlue
                        : colors.darkBlue,
                    }}
                  >
                    {booth.name}
                  </span>
                  <button
                    onClick={() => handleStampBooth(booth.id)}
                    className={`flex items-center justify-center rounded-full font-bold text-sm transition duration-300 ease-in-out transform hover:scale-105`}
                    style={{
                      width: "40px",
                      height: "40px",
                      backgroundColor: (stampedBooths[booth.id] as boolean | undefined) // Assert as boolean | undefined
                        ? colors.yellowAccent
                        : colors.redAccent,
                      color: "#ffffff",
                    }}
                  >
                    {stampedBooths[booth.id] && customStampImages[booth.id] ? ( // Check if both stamped and image exists
                        <img
                          src={customStampImages[booth.id]} // Directly use the string URL
                          alt={`${booth.name} Stamp`}
                          style={{
                            width: "40px",
                            height: "40px",
                            objectFit: "cover",
                            borderRadius: "50%",
                          }}
                          onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { // Explicitly type e
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src =
                              "https://placehold.co/40x40/cccccc/000000?text=✓";
                          }}
                        />
                      ) : (
                        <svg
                          style={{
                            width: "40px",
                            height: "40px",
                            color: "#ffffff",
                          }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M5 13l4 4L19 7"
                          ></path>
                        </svg>
                      )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Display Current Passport */}
        {(userName ||
          userRole ||
          favoriteSessions.length > 0 ||
          Object.values(stampedBooths).some((val) => val) ||
          selectedAvatar ||
          favoriteGenAITool ||
          keyInsights) && (
          <div
            ref={passportRef}
            className="mt-10 p-6 rounded-3xl shadow-xl border"
            style={{
              background: `linear-gradient(to right, ${colors.lightBlueBg}, ${colors.lightRedBg})`,
              borderColor: colors.darkBlue,
            }}
          >
            <h2
              className="text-3xl font-bold text-center mb-6"
              style={{ color: colors.darkBlue }}
            >
              Your AImplify III digital passport
            </h2>
            <div className="flex flex-col items-center mb-6">
              <div
                className="p-2 bg-white rounded-full shadow-lg border animate-bounce-slow w-72 h-72 overflow-hidden flex justify-center items-center"
                style={{ borderColor: colors.redAccent }}
              >
                <img
                  src={selectedAvatar}
                  alt="Your Avatar"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { // Explicitly type e
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src =
                      "https://placehold.co/144x144/cccccc/000000?text=Err";
                  }}
                />
              </div>
              <p
                className="text-xl font-semibold mt-4"
                style={{ color: colors.darkBlue }}
              >
                {userName || "Your Name"}
              </p>
              <p className="text-lg" style={{ color: colors.mediumBlue }}>
                {userRole || "Your Role"}
              </p>
            </div>

            {/* Main content area for passport details, now explicitly organized into boxes */}
            <div className="space-y-6">
              {/* Passport Details Box */}
              <div
                className="p-4 rounded-lg shadow-sm border"
                style={{
                  backgroundColor: colors.lightBlueBg,
                  borderColor: colors.mediumBlue,
                }}
              >
                <p
                  className="font-bold text-lg mb-2"
                  style={{ color: colors.darkBlue }}
                >
                  Passport Details:
                </p>
                <div style={{ paddingLeft: "20px", textIndent: "-20px" }}>
                  <p style={{ display: "flex", alignItems: "flex-start" }}>
                    <span
                      style={{
                        marginRight: "16px",
                        fontSize: "1.25rem",
                        lineHeight: "1",
                      }}
                    >
                      •
                    </span>
                    <span style={{ fontWeight: "bold", fontFamily: "'Roboto Slab', serif" }}>
                      Issued On:{" "}
                      <span style={{ color: colors.darkBlue, fontWeight: "normal", fontFamily: "sans-serif" }}>
                        {passportIssuedDate}
                      </span>
                    </span>
                  </p>
                  <p style={{ display: "flex", alignItems: "flex-start" }}>
                    <span
                      style={{
                        marginRight: "16px",
                        fontSize: "1.25rem",
                        lineHeight: "1",
                      }}
                    >
                      •
                    </span>
                    <span style={{ fontWeight: "bold", fontFamily: "'Roboto Slab', serif" }}>
                      Place:{" "}
                      <span style={{ color: colors.darkBlue, fontWeight: "normal", fontFamily: "sans-serif" }}>
                        {passportPlace}
                      </span>
                    </span>
                  </p>
                  <p style={{ display: "flex", alignItems: "flex-start" }}>
                    <span
                      style={{
                        marginRight: "16px",
                        fontSize: "1.25rem",
                        lineHeight: "1",
                      }}
                    >
                      •
                    </span>
                    <span style={{ fontWeight: "bold", fontFamily: "'Roboto Slab', serif" }}>
                      Valid Until:{" "}
                      <span style={{ color: colors.darkBlue, fontWeight: "normal", fontFamily: "sans-serif" }}>
                        {passportValidUntil}
                      </span>
                    </span>
                  </p>
                </div>
                {favoriteGenAITool && (
                  <div
                    style={{
                      paddingLeft: "20px",
                      textIndent: "-20px",
                      marginTop: "1rem",
                    }}
                  >
                    <p style={{ display: "flex", alignItems: "flex-start" }}>
                      <span
                        style={{
                          marginRight: "16px",
                          fontSize: "1.25rem",
                          lineHeight: "1",
                        }}
                      >
                        •
                      </span>
                      <span style={{ fontWeight: "bold", fontFamily: "'Roboto Slab', serif" }}>
                        My Favorite Gen AI Tool:{" "}
                        <span style={{ color: colors.mediumBlue, fontWeight: "normal", fontFamily: "sans-serif" }}>
                          {favoriteGenAITool}
                        </span>
                      </span>
                    </p>
                  </div>
                )}
                {keyInsights && (
                  <div
                    style={{
                      paddingLeft: "20px",
                      textIndent: "-20px",
                      marginTop: "1rem",
                    }}
                  >
                    <p style={{ display: "flex", alignItems: "flex-start" }}>
                      <span
                        style={{
                          marginRight: "16px",
                          fontSize: "1.25rem",
                          lineHeight: "1",
                        }}
                      >
                        •
                      </span>
                      <span style={{ fontWeight: "bold", fontFamily: "'Roboto Slab', serif" }}>
                        My Key Insights from AImplify III:{" "}
                        <span style={{ color: colors.mediumBlue, fontWeight: "normal", fontFamily: "sans-serif" }}>
                          {keyInsights}
                        </span>
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* Your Favorite Sessions Box */}
              <div
                className="p-4 rounded-lg shadow-sm border"
                style={{
                  backgroundColor: colors.lightRedBg,
                  borderColor: colors.redAccent,
                }}
              >
                <p
                  className="font-bold text-lg mb-2"
                  style={{ color: colors.darkBlue }}
                >
                  Your Favorite Sessions:
                </p>
                {favoriteSessions.length > 0 ? (
                  <div style={{ paddingLeft: "20px", textIndent: "-20px" }}>
                    {favoriteSessions.map((id) => (
                      <p
                        key={id}
                        style={{ display: "flex", alignItems: "flex-start" }}
                      >
                        <span
                          style={{
                            marginRight: "16px",
                            fontSize: "1.25rem",
                            lineHeight: "1",
                          }}
                        >
                          •
                        </span>
                        <span style={{ fontWeight: "normal" }}>
                          {favoriteOptions.find((o) => o.id === id)?.name}
                        </span>
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="italic" style={{ color: colors.mediumBlue }}>
                    No favorites selected yet.
                  </p>
                )}
              </div>

              {/* Your Booth Stamps Box */}
              <div
                className="p-4 rounded-lg shadow-sm border"
                style={{
                  backgroundColor: colors.lightBlueBg,
                  borderColor: colors.mediumBlue,
                }}
              >
                <p
                  className="font-bold text-lg mb-3"
                  style={{ color: colors.darkBlue }}
                >
                  Your Booth Stamps:
                </p>
                <div className="grid grid-cols-4 gap-1 justify-items-center">
                  {boothOptions
                    .filter((booth) => stampedBooths[booth.id])
                    .map((booth) => (
                      <div
                        key={booth.id}
                        className={`p-0.5 rounded-xl flex flex-col items-center justify-center transition-all duration-300 shadow-md`}
                        style={{
                          backgroundColor: "#ffffff",
                          width: "100%",
                          maxWidth: "120px",
                          aspectRatio: "1 / 1",
                          borderColor: colors.mediumBlue,
                          borderWidth: "1px",
                        }}
                      >
                        {stampedBooths[booth.id] && customStampImages[booth.id] ? ( // Check if both stamped and image exists
                            <img
                              src={customStampImages[booth.id]} // Directly use the string URL
                              alt={`${booth.name} Stamp`}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: "50%",
                              }}
                              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => { // Explicitly type e
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src =
                                  "https://placehold.co/80x80/cccccc/000000?text=✓";
                              }}
                            />
                          ) : (
                            <span
                              style={{ fontSize: "4rem", color: colors.darkBlue }}
                            >
                              ✅
                            </span>
                          )}
                      </div>
                    ))}
                </div>
                {boothOptions.filter((booth) => stampedBooths[booth.id])
                  .length === 0 && (
                  <p
                    className="italic text-gray-500 mt-2"
                    style={{ color: colors.mediumBlue }}
                  >
                    No stamps collected yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Download Button */}
        {(userName ||
          userRole ||
          favoriteSessions.length > 0 ||
          Object.values(stampedBooths).some((val) => val) ||
          selectedAvatar ||
          favoriteGenAITool ||
          keyInsights) && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleDownloadPassport}
              className="font-bold py-3 px-6 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center"
              style={{
                backgroundColor: colors.redAccent,
                color: "#ffffff",
              }}
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 10v6m0 0l3-3m-3 3l-3-3m-3 7h12a2 2 0 002-2V7a2 2 0 00-2-2H9.684a2 2 0 00-1.745.968l-2.072 4.144A2 2 0 004 12v3a2 2 0 002 2z"
                ></path>
              </svg>
              Download Passport as Image
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;