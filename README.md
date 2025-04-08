# API d'Authentification

Ce document décrit toutes les routes disponibles dans l'API d'authentification.

## Table des matières
- [Inscription](#inscription)
- [Connexion](#connexion)
- [Déconnexion](#déconnexion)
- [Rafraîchissement du token](#rafraîchissement-du-token)
- [Activation du compte](#activation-du-compte)
- [Décodage du token](#décodage-du-token)
- [Validation du token](#validation-du-token)

## Inscription

**Route:** `POST /api/auth/register`

Inscription d'un nouvel utilisateur avec le provider local.

### Requête
```json
{
  "name": "vSKAH",
  "email": "jbadaire@student.42lyon.fr",
  "password": "Password123!"
}
```

### Réponses possibles

#### Succès (200)
```json
{
  "success": true,
  "message": "Operation successful"
}
```

#### Erreur de validation (400)
```json
{
  "success": false,
  "message": "Invalid input"
}
```

#### Erreur serveur (500)
```json
{
  "success": false,
  "message": "Server error"
}
```

## Connexion

**Route:** `POST /api/auth/login`

Connexion d'un utilisateur avec le provider local.

### Requête
```json
{
  "email": "jbadaire@student.42lyon.fr",
  "password": "Password123!"
}
```

### Réponses possibles

#### Succès (200)
```json
{
  "success": true,
  "data": {
    "user_data": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "vSKAH",
      "email": "jbadaire@student.42lyon.fr",
      "auth_provider": "local",
      "created_at": "2024-03-20T10:00:00Z",
      "updated_at": "2024-03-20T10:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User logged"
}
```

#### Identifiants invalides (401)
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

#### Erreur serveur (500)
```json
{
  "success": false,
  "message": "Server error"
}
```

## Déconnexion

**Route:** `POST /api/auth/logout`

Déconnexion de l'utilisateur actuel.

### Headers requis
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Réponses possibles

#### Succès (200)
```json
{
  "success": true,
  "message": "Operation successful"
}
```

#### Non autorisé (401)
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

#### Erreur serveur (500)
```json
{
  "success": false,
  "message": "Server error"
}
```

## Rafraîchissement du token

**Route:** `POST /api/auth/refresh-token`

Rafraîchissement du token d'accès.

### Réponses possibles

#### Succès (200)
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Refresh Token updated !"
}
```

#### Token invalide (401)
```json
{
  "success": false,
  "message": "Invalid refresh token"
}
```

#### Erreur serveur (500)
```json
{
  "success": false,
  "message": "Server error"
}
```

## Activation du compte

**Route:** `POST /api/auth/activate-account`

Activation du compte utilisateur avec un token de vérification.

### Requête
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Réponses possibles

#### Succès (200)
```json
{
  "success": true,
  "message": "Operation successful"
}
```

#### Token invalide (400)
```json
{
  "success": false,
  "message": "Invalid activation token"
}
```

#### Erreur serveur (500)
```json
{
  "success": false,
  "message": "Server error"
}
```

## Décodage du token

**Route:** `GET /api/token/decode`

Décodage et validation d'un token JWT.

### Headers requis
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Réponses possibles

#### Succès (200)
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "vSKAH",
    "email": "jbadaire@student.42lyon.fr",
    "auth_provider": "local",
    "created_at": "2024-03-20T10:00:00Z",
    "updated_at": "2024-03-20T10:00:00Z"
  },
  "message": "Ce token est valide, les informations contenues dedans ont été décodées !"
}
```

#### Token invalide (401)
```json
{
  "success": false,
  "message": "Invalid token"
}
```

#### Erreur serveur (500)
```json
{
  "success": false,
  "message": "Server error"
}
```

## Validation du token

**Route:** `GET /api/token/validate`

Vérification de la validité d'un token JWT.

### Headers requis
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Réponses possibles

#### Succès (200)
```json
{
  "success": true,
  "message": "Operation successful"
}
```

#### Token invalide (401)
```json
{
  "success": false,
  "message": "Invalid token"
}
```

#### Erreur serveur (500)
```json
{
  "success": false,
  "message": "Server error"
}
```

## Notes importantes

1. Toutes les routes nécessitant une authentification doivent inclure le token JWT dans le header `Authorization` au format `Bearer <token>`.
2. Les tokens JWT ont une durée de validité limitée.
3. En cas d'expiration du token, utilisez la route de rafraîchissement pour obtenir un nouveau token.
4. Les mots de passe doivent contenir au moins 8 caractères.
5. Les noms d'utilisateur doivent contenir au moins 4 caractères et ne peuvent contenir que des lettres. 