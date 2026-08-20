/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase/supabase";

import { generate7CharRecoveryCode } from "../utils/recoveryCodeGenerator";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const saveCachedProfile = (usr, uname) => {
    try {
      if (usr && usr.id) {
        const resolved = uname || usr.user_metadata?.username || (usr.email ? usr.email.split("@")[0].replace(".caquiz", "") : "Student");
        localStorage.setItem("ca_quiz_user_profile", JSON.stringify({ id: usr.id, username: resolved }));
        // Generate fresh session ID & start time upon login so session open time resets to exact login moment
        if (typeof sessionStorage !== "undefined") {
          const freshStartTime = new Date().toISOString();
          const freshSessionId = "s_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 8);
          sessionStorage.setItem("ca_quiz_session_id", freshSessionId);
          sessionStorage.setItem("ca_quiz_session_start_time", freshStartTime);
        }
      } else {
        localStorage.removeItem("ca_quiz_user_profile");
      }
    } catch {
      // ignore
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("ca_quiz_auth_changed"));
    }
  };

  useEffect(() => {
    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      saveCachedProfile(activeUser);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      saveCachedProfile(activeUser);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const register = async (username, password, favouritePlace = "", firstnameYob = "", customRecoveryCode = null) => {
    const cleanUsername = (username || "").trim();
    const cleanFavPlace = (favouritePlace || "").trim();
    const cleanFirstnameYob = (firstnameYob || "").trim();

    if (!cleanUsername) {
      throw new Error("Username is required.");
    }
    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }
    if (!cleanFavPlace) {
      throw new Error("Recovery Word 1 (Favourite Place) is mandatory to register.");
    }
    if (!cleanFirstnameYob) {
      throw new Error("Recovery Word 2 (Firstname_Year of Birth) is mandatory to register.");
    }
    if (!/^[a-zA-Z0-9]+_[0-9]{4}$/.test(cleanFirstnameYob)) {
      throw new Error("Firstname_Year of Birth must follow the format 'Firstname_YYYY' (e.g. John_1998).");
    }

    const email = `${cleanUsername.toLowerCase()}.caquiz@gmail.com`;
    const recoveryCode = customRecoveryCode || generate7CharRecoveryCode();
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: cleanUsername,
          favourite_place: cleanFavPlace,
          firstname_yob: cleanFirstnameYob,
          recovery_code: recoveryCode,
        }
      }
    });
    if (error) throw error;

    // Failsafe insert into registered_users public profile table for admin panel lookup
    if (data?.user) {
      saveCachedProfile(data.user, cleanUsername);
      try {
        await supabase
          .from("registered_users")
          .upsert([
            {
              id: data.user.id,
              username: cleanUsername,
              favourite_place: cleanFavPlace,
              firstname_yob: cleanFirstnameYob,
              recovery_code: recoveryCode,
            }
          ]);
      } catch (err) {
        console.warn("Could not insert user recovery details into registered_users table:", err);
      }
    }
    return { ...data, recoveryCode };
  };

  const login = async (username, password, rememberMe = false) => {
    const cleanUsername = username.trim();
    const email = `${cleanUsername.toLowerCase()}.caquiz@gmail.com`;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    let recoveryCode = null;
    let isNewlyGeneratedForExistingUser = false;

    if (data?.user) {
      saveCachedProfile(data.user, cleanUsername);
      try {
        const { data: profile } = await supabase
          .from("registered_users")
          .select("recovery_code, favourite_place, firstname_yob")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profile?.recovery_code) {
          recoveryCode = profile.recovery_code;
        } else {
          // User registered before recovery codes were introduced: Auto-generate one now!
          const newCode = generate7CharRecoveryCode();
          await supabase
            .from("registered_users")
            .upsert([
              {
                id: data.user.id,
                username: cleanUsername,
                favourite_place: profile?.favourite_place || "Default",
                firstname_yob: profile?.firstname_yob || "Default_2000",
                recovery_code: newCode,
              }
            ]);
          recoveryCode = newCode;
          isNewlyGeneratedForExistingUser = true;
        }
      } catch (err) {
        console.warn("Notice checking existing user recovery code:", err);
      }
    }

    if (!rememberMe) {
      sessionStorage.setItem("ca_quiz_temp_session", "1");
    }
    return { ...data, recoveryCode, isNewlyGeneratedForExistingUser };
  };

  const logout = async () => {
    saveCachedProfile(null);
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const getUsername = () => {
    if (user?.user_metadata?.username) return user.user_metadata.username;
    if (user?.email) {
      const prefix = user.email.split("@")[0];
      return prefix.replace(".caquiz", "");
    }
    try {
      const raw = localStorage.getItem("ca_quiz_user_profile");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.username) return parsed.username;
      }
    } catch {
      // ignore
    }
    return null;
  };

  const resetPassword = async (username, recoveryCodeInput, newPassword) => {
    const cleanUser = username.trim();
    const cleanCode = recoveryCodeInput.trim();

    let isSuccess = false;
    let lastError = null;

    // 1. Try single provided_code RPC signature first
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc("reset_student_password", {
        target_username: cleanUser,
        provided_code: cleanCode,
        new_password: newPassword
      });
      if (!rpcErr && rpcRes === true) {
        isSuccess = true;
      } else if (rpcErr) {
        lastError = rpcErr.message;
      }
    } catch (err) {
      lastError = err.message;
    }

    // 2. If first RPC signature failed or not yet deployed, try 4-parameter legacy signature
    if (!isSuccess) {
      try {
        const { data: rpcRes2, error: rpcErr2 } = await supabase.rpc("reset_student_password", {
          target_username: cleanUser,
          recovery_word1: cleanCode,
          recovery_word2: cleanCode,
          new_password: newPassword
        });
        if (!rpcErr2 && rpcRes2 === true) {
          isSuccess = true;
        } else if (rpcErr2) {
          lastError = rpcErr2.message;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!isSuccess) {
      throw new Error(
        lastError || "Password reset failed. Please ensure your username and 7-character recovery code are correct."
      );
    }

    return true;
  };

  const value = {
    user,
    username: getUsername(),
    loading,
    register,
    login,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
