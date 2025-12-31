export async function authenticatedFetch(url: string, options: RequestInit = {}) {
    const token = sessionStorage.getItem('authToken');

    if (!token) {
        throw new Error('No authentication token found');
    }

    return fetch("http://localhost:8080/" + url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
            'Authorization': `Bearer ${token}`,
        },
    });
}

export async function loginFetch(username: string, password: string) {
    const response = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username: username,
            password: password,
        }),
    });
    return response;
}

export async function registerFetch(
    username: string,
    password: string,
    email: string,
    keys?: { publicKey: string, encryptedPrivateKey: string, salt: string, iv: string }
) {
    const response = await fetch("http://localhost:8080/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username: username,
            password: password,
            email: email,
            ...(keys && {
                publicKey: keys.publicKey,
                encryptedPrivateKey: keys.encryptedPrivateKey,
                salt: keys.salt,
                iv: keys.iv
            })
        }),
    });
    return response;
}