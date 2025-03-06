import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session, User } from "@supabase/supabase-js";
import { SplashScreen, useRouter, useSegments } from "expo-router";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { supabase } from "@/config/supabase";
import { CreateGemstoneInputType } from "@/hooks/useCreateGemstone";
import { useOrganizationMemberships } from "@/hooks/useOrganizationMemberships";
import { Tables } from "@/lib/database.types";
import { useQueryClient } from "@tanstack/react-query";
SplashScreen.preventAutoHideAsync();

// Storage key for the active organization
const ACTIVE_ORGANIZATION_KEY = "gemstone_tracker_active_organization";

type SupabaseContextProps = {
	user: User | null;
	session: Session | null;
	initialized?: boolean;
	signUp: (email: string, password: string) => Promise<void>;
	signInWithPassword: (email: string, password: string) => Promise<void>;
	signOut: () => Promise<void>;
	createGemstone: (
		gemstone: CreateGemstoneInputType,
	) => Promise<Tables<"stones">>;
	activeOrganization: Tables<"organizations"> | null;
	userOrganizations: Tables<"organizations">[];
	onSelectOrganization: (organizationId: string) => Promise<void>;
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
	createGemstone: async () => new Promise((resolve) => resolve({} as any)),
	activeOrganization: null,
	userOrganizations: [],
	onSelectOrganization: async () => {},
});

export const useSupabase = () => useContext(SupabaseContext);

export const SupabaseProvider = ({ children }: SupabaseProviderProps) => {
	const router = useRouter();
	const segments = useSegments();
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [initialized, setInitialized] = useState<boolean>(false);
	const queryClient = useQueryClient();
	const { data: organizationMemberships } = useOrganizationMemberships(session);
	const [activeOrganization, setActiveOrganization] =
		useState<Tables<"organizations"> | null>(null);

	// Derive userOrganizations from organizationMemberships
	const userOrganizations = useMemo(() => {
		if (!organizationMemberships?.length) return [];
		return organizationMemberships
			.map((membership) => membership.organization)
			.filter((org) => org !== null);
	}, [organizationMemberships]);

	// Load the active organization from AsyncStorage on initialization
	useEffect(() => {
		const loadActiveOrganization = async () => {
			try {
				const storedOrgId = await AsyncStorage.getItem(ACTIVE_ORGANIZATION_KEY);

				if (storedOrgId && organizationMemberships?.length) {
					const storedOrg = organizationMemberships.find(
						(m) => m.organization_id === storedOrgId,
					);

					if (storedOrg) {
						setActiveOrganization(storedOrg.organization);
						return;
					}
				}

				// If no stored organization or it's not found, use default logic
				if (organizationMemberships?.length && !activeOrganization) {
					const ownerMembership = organizationMemberships.find(
						(m) => m.role === "owner",
					);

					if (ownerMembership) {
						setActiveOrganization(ownerMembership.organization);
					}
				}
			} catch (error) {
				console.error("Error loading active organization:", error);
			}
		};

		loadActiveOrganization();
	}, [organizationMemberships]);

	const onSelectOrganization = async (organizationId: string) => {
		const membership = organizationMemberships?.find(
			(m) => m.organization_id === organizationId,
		);

		if (!membership || !membership.organization) return;

		setActiveOrganization(membership.organization);
		try {
			await AsyncStorage.setItem(ACTIVE_ORGANIZATION_KEY, organizationId);
		} catch (error) {
			console.error("Error saving active organization:", error);
		}
		queryClient.invalidateQueries({ queryKey: ["gemstone"] });
		queryClient.invalidateQueries({ queryKey: ["gemstones"] });
	};

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
		} else if (!session && inProtectedGroup) {
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
				createGemstone,
				activeOrganization,
				userOrganizations,
				onSelectOrganization,
			}}
		>
			{children}
		</SupabaseContext.Provider>
	);
};
