/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase/supabase";

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

  const register = async (username, password, favouritePlace, firstnameYob) => {
    const email = `${username.trim().toLowerCase()}.caquiz@gmail.com`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.trim(),
          favourite_place: favouritePlace.trim(),
          firstname_yob: firstnameYob.trim()
        }
      }
    });
    if (error) throw error;

    // Failsafe insert into registered_users public profile table for admin panel lookup
    if (data?.user) {
      try {
        await supabase
          .from("registered_users")
          .insert([
            {
              id: data.user.id,
              username: username.trim(),
              favourite_place: favouritePlace.trim(),
              firstname_yob: firstnameYob.trim()
            }
          ]);
      } catch (err) {
        console.warn("Could not insert user recovery details into registered_users table:", err);
      }
    }
    return data;
  };

  const login = async (username, password, rememberMe = false) => {
    const email = `${username.trim().toLowerCase()}.caquiz@gmail.com`;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    // If rememberMe is false, session expires when browser closes
    if (!rememberMe) {
      // Supabase handles sessions via localStorage by default.
      // We store a session flag so on next load without cookie we can check.
      sessionStorage.setItem("ca_quiz_temp_session", "1");
    }
    return data;
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

  const value = {
    user,
    username: getUsername(),
    loading,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
