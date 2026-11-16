<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPOpenSourceSaver\JWTAuth\JWT;
use Tests\TestCase;

class AuthRefreshTest extends TestCase
{
    use RefreshDatabase;

    /** A token issued two hours ago whose 60 minutes ran out an hour ago (the situation after an hour of use). */
    private function expiredToken(int $issuedSecondsAgo = 7200): string
    {
        $user = User::factory()->create();
        $b64 = fn (string $d) => rtrim(strtr(base64_encode($d), '+/', '-_'), '=');

        $iat = time() - $issuedSecondsAgo;
        $header = $b64(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $payload = $b64(json_encode([
            'iss' => url('/api/v1/auth/login'), 'iat' => $iat, 'exp' => $iat + 3600, 'nbf' => $iat,
            'jti' => bin2hex(random_bytes(8)), 'sub' => (string) $user->getKey(), 'prv' => sha1(User::class),
        ]));
        $signature = $b64(hash_hmac('sha256', "{$header}.{$payload}", config('jwt.secret'), true));

        return "{$header}.{$payload}.{$signature}";
    }

    /**
     * In production every request is a new PHP process. Inside one test process the JWT object would
     * keep the previous request's token, so reset it to behave like a new request.
     */
    private function freshRequestState(): void
    {
        app()->forgetInstance(JWT::class);
        app()->forgetInstance('tymon.jwt');
        app('auth')->forgetGuards();
    }

    private function asToken(string $token): static
    {
        $this->freshRequestState();

        return $this->withHeader('Authorization', "Bearer {$token}");
    }

    public function test_an_expired_token_is_rejected_but_can_be_refreshed(): void
    {
        $token = $this->expiredToken();

        $this->asToken($token)->getJson('/api/v1/auth/me')->assertStatus(401);
        $this->asToken($token)->getJson('/api/v1/products')->assertStatus(401);

        $fresh = $this->asToken($token)->postJson('/api/v1/auth/refresh')->assertOk()->json('access_token');
        $this->assertNotSame($token, $fresh);

        $this->asToken($fresh)->getJson('/api/v1/auth/me')->assertOk();
        $this->asToken($fresh)->getJson('/api/v1/products')->assertOk();
    }

    public function test_a_valid_token_can_still_be_refreshed(): void
    {
        $user = User::factory()->create(['password' => 'secret-pass']);
        $token = $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'secret-pass'])->assertOk()->json('access_token');

        $fresh = $this->asToken($token)->postJson('/api/v1/auth/refresh')->assertOk()->json('access_token');

        $this->asToken($fresh)->getJson('/api/v1/auth/me')->assertOk();
    }

    public function test_a_token_past_the_refresh_window_cannot_be_refreshed(): void
    {
        $token = $this->expiredToken(issuedSecondsAgo: 15 * 86400); // refresh window is 2 weeks

        $this->asToken($token)->postJson('/api/v1/auth/refresh')->assertStatus(401);
    }

    public function test_refresh_without_a_token_is_401_not_a_crash(): void
    {
        $this->freshRequestState();

        $this->postJson('/api/v1/auth/refresh')->assertStatus(401);
    }

    public function test_a_logged_out_token_cannot_be_refreshed(): void
    {
        $user = User::factory()->create(['password' => 'secret-pass']);
        $token = $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'secret-pass'])->assertOk()->json('access_token');
        $this->asToken($token)->postJson('/api/v1/auth/logout')->assertNoContent();

        $this->asToken($token)->postJson('/api/v1/auth/refresh')->assertStatus(401);
    }
}
