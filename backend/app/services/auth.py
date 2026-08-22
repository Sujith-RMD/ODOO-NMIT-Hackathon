from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.config import settings
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.schemas.auth import LoginRequest, LoginResponse, TokenData, ChangePasswordRequest, ChangePasswordResponse, UserResponse
from app.schemas.employee import EmployeeCreate
from fastapi import HTTPException, status


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        return pwd_context.hash(password)

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    def decode_token(self, token: str) -> Optional[TokenData]:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id: int = payload.get("sub")
            login_id: str = payload.get("login_id")
            role: str = payload.get("role")
            if user_id is None:
                return None
            return TokenData(user_id=user_id, login_id=login_id, role=UserRole(role))
        except JWTError:
            return None

    def authenticate_user(self, login_id: str, password: str) -> Optional[User]:
        user = self.db.query(User).filter(User.login_id == login_id).first()
        if not user:
            return None
        if not self.verify_password(password, user.hashed_password):
            return None
        return user

    def login(self, login_request: LoginRequest) -> LoginResponse:
        user = self.authenticate_user(login_request.login_id, login_request.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid login ID or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated",
            )

        access_token = self.create_access_token(
            data={"sub": user.id, "login_id": user.login_id, "role": user.role.value}
        )
        return LoginResponse(
            access_token=access_token,
            user=UserResponse.model_validate(user)
        )

    def get_current_user(self, token: str) -> User:
        token_data = self.decode_token(token)
        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user = self.db.query(User).filter(User.id == token_data.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated",
            )
        return user

    def change_password(self, user: User, change_request: ChangePasswordRequest) -> ChangePasswordResponse:
        if not self.verify_password(change_request.current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        user.hashed_password = self.get_password_hash(change_request.new_password)
        self.db.commit()
        return ChangePasswordResponse()

    def generate_login_id(self, first_name: str, last_name: str, joining_year: int) -> str:
        """Generate unique login ID: [CompanyPrefix][First2FirstName+First2LastName][Year][Serial]"""
        prefix = settings.COMPANY_PREFIX.upper()
        name_part = (first_name[:2] + last_name[:2]).upper()
        year_part = str(joining_year)  # Full 4-digit year per spec (e.g. OIJODO20260001)

        base = f"{prefix}{name_part}{year_part}"

        # Find the highest serial number for this base
        existing = self.db.query(User).filter(User.login_id.like(f"{base}%")).all()
        max_serial = 0
        for u in existing:
            try:
                serial = int(u.login_id[len(base):])
                max_serial = max(max_serial, serial)
            except ValueError:
                continue

        serial = max_serial + 1
        return f"{base}{serial:04d}"

    def create_employee_with_user(self, employee_data: EmployeeCreate, password: str) -> tuple[User, Employee]:
        # Generate login ID
        joining_year = employee_data.date_of_joining.year
        login_id = self.generate_login_id(employee_data.first_name, employee_data.last_name, joining_year)

        # Create user
        hashed_password = self.get_password_hash(password)
        user = User(
            login_id=login_id,
            email=employee_data.email,
            hashed_password=hashed_password,
            role=UserRole.EMPLOYEE
        )
        self.db.add(user)
        self.db.flush()

        # Create employee
        employee = Employee(
            user_id=user.id,
            **employee_data.model_dump()
        )
        self.db.add(employee)
        self.db.commit()
        self.db.refresh(user)
        self.db.refresh(employee)

        return user, employee