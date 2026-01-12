import { unauthenticatedPost } from "./api";
import { encryptionService } from "./EncryptionService";


class AuthenticationService {
    async login(username: string, password: string) {
        const response = await unauthenticatedPost({ username, password }, "auth/login")

        if (!response.ok) {
            throw new Error("Login failed");
        }

        const authResponse = await response.json();

        if (!authResponse.token) {
            throw new Error("No token in response");
        }

        sessionStorage.setItem("authToken", authResponse.token);

        if (authResponse.encryptedPrivateKey && authResponse.salt && authResponse.iv) {
            const privateKey = await encryptionService.decryptPrivateKey(
                authResponse.encryptedPrivateKey,
                password,
                authResponse.salt,
                authResponse.iv
            );
            sessionStorage.setItem("privateKey", privateKey);
        }

        if (authResponse.publicKey) {
            sessionStorage.setItem("publicKey", authResponse.publicKey);
        }
    }

    async register(username: string, password: string, email: string) {
        const { publicKey, privateKey } = await encryptionService.generateKeyPairFromPassword(password);

        const { encryptedKey, salt, iv } = await encryptionService.encryptPrivateKey(privateKey, password);

        const response = await unauthenticatedPost({
            username,
            password,
            email,
            publicKey,
            encryptedPrivateKey: encryptedKey,
            salt,
            iv
        }, "auth/register");

        if (response.ok) {
            sessionStorage.setItem("publicKey", publicKey);
            sessionStorage.setItem("privateKey", privateKey);
        }

        return response;
    }

    getStoredToken(): string | null {
        if (typeof window !== "undefined") {
            return sessionStorage.getItem("authToken");
        }
        return null;
    }

    clearToken() {
        if (typeof window !== "undefined") {
            sessionStorage.removeItem("authToken");
        }
    }

    async logoutUser() {
       await fetch('/logout')
        this.clearToken()
}
}
export const authenticationService = new AuthenticationService();