"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged  } from "@/lib/firebase/auth";
import { auth } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase/config";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(async (user) => {
      if (user?.email) {
        setLoading(true);
        try {
          // Check Firestore for role
          const userDocRef = doc(firestore, "adminemail", user.email);
          const userDoc = await getDoc(userDocRef);
          const isAdmin = userDoc.exists() && userDoc.data()?.role === "admin";

          // Redirect based on role
          router.push(isAdmin ? "/admin" : "/");
        } catch (err: any) {
          console.error("Error fetching user role:", err);
          setError("Failed to fetch user role. Please login again.");
          await auth.signOut(); // optional: force re-login if role fetch fails
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {loading ? (
        <div className="text-blue-600 text-lg">Checking login status...</div>
      ) : (
        <div>Please login with Google</div>
      )}
      {error && (
        <div className="mt-4 p-2 bg-red-100 text-red-700 rounded border border-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
