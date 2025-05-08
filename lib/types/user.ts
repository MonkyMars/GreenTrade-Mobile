export interface User {
	id: string;
	name: string;
	email: string;
	location: string;
	profileUrl: string;
	createdAt: string;
	lastSignInAt: string; // will be undefined if user has not confirmed their email.
	phone?: string;
	profileImage?: string;
	bio?: string;
	ecoScore?: number;
}
