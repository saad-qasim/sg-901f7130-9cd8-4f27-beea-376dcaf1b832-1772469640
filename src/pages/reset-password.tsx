const checkSession = async () => {
    try {
        setCheckingSession(true);

        // 1) إذا الرابط يحتوي توكن في الـ hash (recovery link)
        if (typeof window !== "undefined" && window.location.hash) {
            const hash = window.location.hash.startsWith("#")
                ? window.location.hash.slice(1)
                : window.location.hash;

            const params = new URLSearchParams(hash);
            const access_token = params.get("access_token");
            const refresh_token = params.get("refresh_token");
            const type = params.get("type");

            // إذا هو رابط استرجاع فعلاً
            if (type === "recovery" && access_token && refresh_token) {
                // 2) خزّن الجلسة في Supabase
                const { data, error } = await supabase.auth.setSession({
                    access_token,
                    refresh_token,
                });

                if (error) throw error;

                if (data.session) {
                    setValidSession(true);
                    setError("");
                    return;
                }
            }
        }

        // 3) إذا ماكو hash أو ما نجح setSession، جرّب session الحالية
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session) {
            setValidSession(true);
            setError("");
        } else {
            setValidSession(false);
            setError("رابط إعادة التعيين غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.");
        }
    } catch (err: any) {
        console.error("Error checking session:", err);
        setValidSession(false);
        setError(err?.message || "حدث خطأ أثناء التحقق من الجلسة");
    } finally {
        setCheckingSession(false);
    }
};