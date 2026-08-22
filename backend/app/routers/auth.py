from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth import AuthService
from app.schemas.auth import LoginRequest, LoginResponse, ChangePasswordRequest, ChangePasswordResponse, UserResponse
from app.models.user import User


router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


def get_current_user(token: str = Depends(oauth2_scheme), auth_service: AuthService = Depends(get_auth_service)) -> User:
    return auth_service.get_current_user(token)


@router.post("/login", response_model=LoginResponse)
def login(login_data: LoginRequest, auth_service: AuthService = Depends(get_auth_service)):
    return auth_service.login(login_data)


@router.post("/change-password", response_model=ChangePasswordResponse)
def change_password(
    change_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service)
):
    return auth_service.change_password(current_user, change_data)


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}