import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc
} from "./firebase-config.js";

export const USER_ROLES = {
  RETAIL: "retail",
  CALLIGRAPHER: "calligrapher",
  ADMIN: "admin"
};

let currentUserState = {
  user: null,
  role: USER_ROLES.RETAIL,
  profile: null
};

export const getCurrentUser = () => currentUserState;

export const initAuth = (onStateChangeCallback) => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userDocRef);

        let profileData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split("@")[0],
          role: USER_ROLES.RETAIL,
          isCalligrapher: false,
          isAdmin: false,
          phone: "",
          address: ""
        };

        if (userSnap.exists()) {
          profileData = { ...profileData, ...userSnap.data() };
        } else {
          await setDoc(userDocRef, profileData);
        }

        let role = USER_ROLES.RETAIL;
        if (profileData.isAdmin || profileData.role === USER_ROLES.ADMIN || user.email === "admin@elfeqy.com") {
          role = USER_ROLES.ADMIN;
        } else if (profileData.isCalligrapher || profileData.role === USER_ROLES.CALLIGRAPHER) {
          role = USER_ROLES.CALLIGRAPHER;
        }

        currentUserState = {
          user,
          role,
          profile: profileData
        };
      } catch (err) {
        console.error("Error fetching user profile:", err);
        currentUserState = {
          user,
          role: USER_ROLES.RETAIL,
          profile: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "عميل",
            role: USER_ROLES.RETAIL
          }
        };
      }
    } else {
      currentUserState = {
        user: null,
        role: USER_ROLES.RETAIL,
        profile: null
      };
    }

    if (onStateChangeCallback) {
      onStateChangeCallback(currentUserState);
    }
    window.dispatchEvent(new CustomEvent("authStateUpdated", { detail: currentUserState }));
  });
};

export const loginWithEmail = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const registerWithEmail = async (email, password, displayName, phone = "", roleRequest = USER_ROLES.RETAIL) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const isCalligrapherRequested = roleRequest === USER_ROLES.CALLIGRAPHER;

  const profileData = {
    uid: user.uid,
    email: user.email,
    displayName: displayName || email.split("@")[0],
    role: isCalligrapherRequested ? USER_ROLES.RETAIL : USER_ROLES.RETAIL,
    isCalligrapher: false,
    calligrapherRequested: isCalligrapherRequested,
    isAdmin: email.toLowerCase() === "admin@elfeqy.com",
    phone: phone || "",
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, "users", user.uid), profileData);
  return user;
};

export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  const userDocRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userDocRef);

  if (!userSnap.exists()) {
    const profileData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "عميل",
      role: USER_ROLES.RETAIL,
      isCalligrapher: false,
      isAdmin: user.email.toLowerCase() === "admin@elfeqy.com",
      createdAt: new Date().toISOString()
    };
    await setDoc(userDocRef, profileData);
  }

  return user;
};

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

export const logoutUser = async () => {
  await signOut(auth);
};
