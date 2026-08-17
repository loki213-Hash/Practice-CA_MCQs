/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase/supabase";

import { generate7CharRecoveryCode } from "../utils/recoveryCodeGenerator";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const register = async (username, password, favouritePlace = "", firstnameYob = "", customRecoveryCode = null) => {
    const email = `${username.trim().toLowerCase()}.caquiz@gmail.com`;
    const recoveryCode = customRecoveryCode || generate7CharRecoveryCode();
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.trim(),
          favourite_place: favouritePlace.trim(),
          firstname_yob: firstnameYob.trim(),
          recovery_code: recoveryCode,
        }
      }
    });
    if (error) throw error;

    // Failsafe insert into registered_users public profile table for admin panel lookup
    if (data?.user) {
      try {
        await supabase
          .from("registered_users")
          .upsert([
            {
              id: data.user.id,
              username: username.trim(),
              favourite_place: favouritePlace.trim(),
              firstname_yob: firstnameYob.trim(),
              recovery_code: recoveryCode,
            }
          ]);
      } catch (err) {
        console.warn("Could not insert user recovery details into registered_users table:", err);
      }
      // Recovery code is shown once on-screen after registration.
      // It is intentionally NOT stored in localStorage for security reasons.
    }
    return { ...data, recoveryCode };
  };

  const login = async (username, password, rememberMe = false) => {
    const email = `${username.trim().toLowerCase()}.caquiz@gmail.com`;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    let recoveryCode = null;
    let isNewlyGeneratedForExistingUser = false;
    const cleanUser = username.trim().toLowerCase();

    if (data?.user) {
      try {
        const { data: profile } = await supabase
          .from("registered_users")
          .select("recovery_code, favourite_place, firstname_yob")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profile?.recovery_code) {
          recoveryCode = profile.recovery_code;
          // Recovery code is available server-side only; never cached in localStorage.
        } else {
          // User registered before recovery codes were introduced: Auto-generate one now!
          const newCode = generate7CharRecoveryCode();
          await supabase
            .from("registered_users")
            .upsert([
              {
                id: data.user.id,
                username: username.trim(),
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
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const getUsername = () => {
    if (!user || !user.email) return null;
    const prefix = user.email.split("@")[0];
    return prefix.replace(".caquiz", "");
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
