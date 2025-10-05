/**
 * Diagnóstico específico del problema de conectividad
 */

export async function diagnoseProblem() {
    console.log('🔍 === DIAGNÓSTICO ESPECÍFICO ===\n');

    const { URL_SERVER } = require('../../settings');

    // Test 1: Endpoint de salud básico
    console.log('1️⃣ Testing basic server connectivity...');
    try {
        const healthResponse = await fetch(`${URL_SERVER}`, {
            method: 'GET'
        });
        console.log('✅ Basic server response:', healthResponse.status);
    } catch (error) {
        console.log('❌ Basic server unreachable:', error.message);
        return 'SERVER_DOWN';
    }

    // Test 2: API base path
    console.log('\n2️⃣ Testing API base path...');
    try {
        const apiResponse = await fetch(`${URL_SERVER}/api`, {
            method: 'GET'
        });
        console.log('✅ API base accessible:', apiResponse.status);
    } catch (error) {
        console.log('❌ API base inaccessible:', error.message);
    }

    // Test 3: Users endpoint específico
    console.log('\n3️⃣ Testing users endpoint...');
    try {
        const usersResponse = await fetch(`${URL_SERVER}/api/users/login`, {
            method: 'OPTIONS' // Preflight CORS
        });
        console.log('✅ Users endpoint OPTIONS:', usersResponse.status);
    } catch (error) {
        console.log('❌ Users endpoint OPTIONS failed:', error.message);
    }

    // Test 4: Providers endpoint (que sabemos funciona)
    console.log('\n4️⃣ Testing providers endpoint...');
    try {
        const providersResponse = await fetch(`${URL_SERVER}/api/providers/login`, {
            method: 'OPTIONS'
        });
        console.log('✅ Providers endpoint OPTIONS:', providersResponse.status);
    } catch (error) {
        console.log('❌ Providers endpoint OPTIONS failed:', error.message);
    }

    // Test 5: POST real a users (con datos inválidos)
    console.log('\n5️⃣ Testing real POST to users...');
    try {
        const realUsersResponse = await fetch(`${URL_SERVER}/api/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'test@test.com',
                password: 'invalid'
            })
        });

        console.log('✅ Real users POST response:', {
            status: realUsersResponse.status,
            statusText: realUsersResponse.statusText
        });

        const responseText = await realUsersResponse.text();
        console.log('📄 Response body preview:', responseText.substring(0, 200));

    } catch (error) {
        console.log('❌ Real users POST failed:', error.message);
        return 'USERS_ENDPOINT_BROKEN';
    }

    console.log('\n✅ Diagnóstico completado');
    return 'SUCCESS';
}

// Función simplificada para usar en tu componente
export async function quickDiagnose() {
    console.log('⚡ Quick diagnosis...');

    const { URL_SERVER } = require('../../settings');

    try {
        const response = await fetch(`${URL_SERVER}/api/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'wrongpass'
            })
        });

        console.log('🎯 Quick test result:', {
            status: response.status,
            ok: response.ok,
            url: response.url
        });

        if (response.status === 401 || response.status === 422) {
            console.log('✅ Endpoint is working! (401/422 expected for bad credentials)');
            return 'WORKING';
        } else {
            console.log('⚠️ Unexpected status:', response.status);
            return 'UNEXPECTED';
        }

    } catch (error) {
        console.log('❌ Quick test failed:', error.message);
        return 'FAILED';
    }
}

/**
 * Función para usar en tu LoginScreen:
 * 
 * import { quickDiagnose, diagnoseProblem } from '../debug/networkDiagnosis';
 * 
 * // Antes del login:
 * const result = await quickDiagnose();
 * if (result !== 'WORKING') {
 *   console.log('Network issue detected, running full diagnosis...');
 *   await diagnoseProblem();
 * }
 */