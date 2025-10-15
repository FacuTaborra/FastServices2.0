"""
Modelos de SQLAlchemy y Pydantic para FastServices.
"""

from .User import (
    User,
    UserRole,
    UserCreate,
    UserResponse,
    UserInDB,
    LoginRequest,
    UserUpdate,
    ChangePasswordRequest,
)
from .ProviderProfile import (
    ProviderProfile,
    ProviderProfileCreate,
    ProviderProfileUpdate,
    ProviderProfileResponse,
    ProviderRegisterRequest,
    ProviderResponse,
    ProviderLicense,
    LicenseType,
    ProviderServiceArea,
)
from .Address import (
    Address,
    AddressCreate,
    AddressUpdate,
    AddressResponse,
    AddressListResponse,
)
from .Token import Token
from .ServiceRequest import (
    ServiceRequestType,
    ServiceRequestStatus,
    ProposalStatus,
    ValidationStatus,
    MatchStatus,
    ServiceStatus,
    ServiceRequest,
    ServiceRequestImage,
    ServiceRequestMatch,
    ServiceRequestProposal,
    Service,
    Currency,
    AIModel,
    RequestInferredLicense,
    ServiceReview,
    ServiceStatusHistory,
)
from .ServiceRequestSchemas import (
    ServiceRequestAttachment,
    ServiceRequestCreate,
    ServiceRequestImageResponse,
    ServiceRequestProposalResponse,
    ServiceRequestResponse,
    ServiceSummaryResponse,
    ServiceRequestConfirmPayment,
    ServiceRequestUpdate,
    ServiceCancelRequest,
)

__all__ = [
    # Modelos SQLAlchemy
    "User",
    "ProviderProfile",
    "ProviderLicense",
    "ProviderServiceArea",
    "LicenseType",
    "Address",
    "ServiceRequest",
    "ServiceRequestImage",
    "ServiceRequestMatch",
    "ServiceRequestProposal",
    "Service",
    "Currency",
    "AIModel",
    "RequestInferredLicense",
    "ServiceReview",
    "ServiceStatusHistory",
    # Enums
    "UserRole",
    "ServiceRequestType",
    "ServiceRequestStatus",
    "ProposalStatus",
    "ValidationStatus",
    "MatchStatus",
    "ServiceStatus",
    # Modelos Pydantic para User
    "UserCreate",
    "UserResponse",
    "UserInDB",
    "LoginRequest",
    "UserUpdate",
    "ChangePasswordRequest",
    # Modelos Pydantic para ProviderProfile
    "ProviderProfileCreate",
    "ProviderProfileUpdate",
    "ProviderProfileResponse",
    "ProviderRegisterRequest",
    "ProviderResponse",
    # Modelos Pydantic para Address
    "AddressCreate",
    "AddressUpdate",
    "AddressResponse",
    "AddressListResponse",
    # Modelos Pydantic para ServiceRequest
    "ServiceRequestAttachment",
    "ServiceRequestCreate",
    "ServiceRequestImageResponse",
    "ServiceRequestProposalResponse",
    "ServiceRequestResponse",
    "ServiceSummaryResponse",
    "ServiceRequestConfirmPayment",
    "ServiceRequestUpdate",
    "ServiceCancelRequest",
    # Token
    "Token",
]
