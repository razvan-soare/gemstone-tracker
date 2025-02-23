import { Session, User } from "@supabase/supabase-js";
import { useRouter, useSegments, SplashScreen } from "expo-router";
import { createContext, useContext, useEffect, useState } from "react";

import { supabase } from "@/config/supabase";
import { Tables } from "@/lib/database.types";
import { CreateGemstoneInputType } from "@/hooks/useCreateGemstone";

SplashScreen.preventAutoHideAsync();

type SupabaseContextProps = {
	user: User | null;
	session: Session | null;
	initialized?: boolean;
	signUp: (email: string, password: string) => Promise<void>;
	signInWithPassword: (email: string, password: string) => Promise<void>;
	signOut: () => Promise<void>;
	fetchGemstones: () => Promise<Tables<"stones">[]>;
	createGemstone: (
		gemstone: CreateGemstoneInputType,
	) => Promise<Tables<"stones">>;
	fetchUserOrganizations: () => Promise<Tables<"organizations">[]>;
};

type SupabaseProviderProps = {
	children: React.ReactNode;
};

export const SupabaseContext = createContext<SupabaseContextProps>({
	user: null,
	session: null,
	initialized: false,
	signUp: async () => {},
	signInWithPassword: async () => {},
	signOut: async () => {},
	fetchGemstones: async () => [],
	createGemstone: async () => new Promise((resolve) => resolve({} as any)),
	fetchUserOrganizations: async () => [] as Tables<"organizations">[],
});

export const useSupabase = () => useContext(SupabaseContext);

export const SupabaseProvider = ({ children }: SupabaseProviderProps) => {
	const router = useRouter();
	const segments = useSegments();
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [initialized, setInitialized] = useState<boolean>(false);

	const signUp = async (email: string, password: string) => {
		const { error } = await supabase.auth.signUp({
			email,
			password,
		});
		if (error) {
			throw error;
		}
	};

	const signInWithPassword = async (email: string, password: string) => {
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});
		if (error) {
			throw error;
		}
	};

	const signOut = async () => {
		const { error } = await supabase.auth.signOut();
		if (error) {
			throw error;
		}
	};

	const fetchGemstones = async () => {
		const { data, error } = await supabase
			.from("stones")
			.select("*")
			.order("created_at", { ascending: false });

		if (error) {
			throw error;
		}

		return data;
	};

	const createGemstone = async (gemstone: CreateGemstoneInputType) => {
		const { data, error } = await supabase
			.from("stones")
			.insert(gemstone)
			.select()
			.single();

		if (error) {
			throw error;
		}

		return data;
	};

	const fetchUserOrganizations = async () => {
		const { data: memberships, error: membersError } = await supabase
			.from("organization_members")
			.select("organization_id")
			.eq("user_id", user?.id)
			.limit(1);

		if (membersError) {
			throw membersError;
		}

		if (!memberships?.length) {
			return [];
		}

		const { data: organizations, error: orgsError } = await supabase
			.from("organizations")
			.select("*")
			.eq("id", memberships[0].organization_id)
			.single();

		if (orgsError) {
			throw orgsError;
		}

		return organizations ? [organizations] : [];
	};

	useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
			setUser(session ? session.user : null);
			setInitialized(true);
		});

		supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
			setUser(session ? session.user : null);
		});
	}, []);

	useEffect(() => {
		if (!initialized) return;

		const inProtectedGroup = segments[1] === "(protected)";

		if (session && !inProtectedGroup) {
			router.replace("/(app)/(protected)");
		} else if (!session) {
			router.replace("/(app)/welcome");
		}

		/* HACK: Something must be rendered when determining the initial auth state... 
		instead of creating a loading screen, we use the SplashScreen and hide it after
		a small delay (500 ms)
		*/

		setTimeout(() => {
			SplashScreen.hideAsync();
		}, 500);
	}, [initialized, session]);

	return (
		<SupabaseContext.Provider
			value={{
				user,
				session,
				initialized,
				signUp,
				signInWithPassword,
				signOut,
				fetchGemstones,
				createGemstone,
				fetchUserOrganizations,
			}}
		>
			{children}
		</SupabaseContext.Provider>
	);
};
