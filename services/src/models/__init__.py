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
    ProviderLicenseCreate,
    ProviderLicenseResponse,
    ProviderLicenseBulkCreate,
    ProviderOverviewKpisResponse,
    ProviderRevenuePoint,
    ProviderRevenueStatsResponse,
)
from .Address import (
    Address,
    AddressCreate,
    AddressUpdate,
    AddressResponse,
    AddressListResponse,
)
from .Token import Token
from .PushToken import PushToken, PushTokenCreate
from .Tag import (
    Tag,
    ServiceRequestTag,
    ProviderLicenseTag,
    TagResponse,
    ServiceRequestTagResponse,
    ProviderLicenseTagResponse,
)
from .ServiceRequest import (
    ServiceRequestType,
    ServiceRequestStatus,
    ProposalStatus,
    ServiceStatus,
    ServiceRequest,
    ServiceRequestImage,
    ServiceRequestProposal,
    Service,
    Currency,
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
from .GeneralResponse import GeneralResponse

__all__ = [
    # Modelos SQLAlchemy
    "User",
    "ProviderProfile",
    "ProviderLicense",
    "Tag",
    "ServiceRequestTag",
    "ProviderLicenseTag",
    "Address",
    "ServiceRequest",
    "ServiceRequestImage",
    "ServiceRequestProposal",
    "Service",
    "Currency",
    "ServiceReview",
    "ServiceStatusHistory",
    # Enums
    "UserRole",
    "ServiceRequestType",
    "ServiceRequestStatus",
    "ProposalStatus",
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
    "ProviderLicenseCreate",
    "ProviderLicenseResponse",
    "ProviderLicenseBulkCreate",
    "ProviderOverviewKpisResponse",
    "ProviderRevenuePoint",
    "ProviderRevenueStatsResponse",
    "ProviderLicenseCreate",
    "ProviderLicenseResponse",
    "ProviderLicenseBulkCreate",
    "TagResponse",
    "ServiceRequestTagResponse",
    "ProviderLicenseTagResponse",
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
    "PushToken",
    "PushTokenCreate",
    "GeneralResponse",
]
