import React, { useEffect, useState } from 'react';
import { useBooking } from '../context/BookingContext';
import {CheckCircleIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

const BookingStatus: React.FC = () => {
  const { currentBooking, isConnected, stopStatusTracking } = useBooking();
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!currentBooking || currentBooking.status !== 'approved') return;

    const interval = setInterval(() => {
      const bookingDateTime = new Date(`${currentBooking.date} ${convertBengaliTime(currentBooking.time)}`);
      const endTime = new Date(bookingDateTime.getTime() + (getServiceDuration(currentBooking.serviceName) * 60 * 1000));
      const autoCloseTime = new Date(endTime.getTime() + (5 * 60 * 1000));
      
      const timeLeft = autoCloseTime.getTime() - Date.now();
      
      if (timeLeft <= 0) {
        setTimeRemaining('সময় শেষ');
        clearInterval(interval);
      } else {
        const minutes = Math.floor(timeLeft / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentBooking]);

  // Convert Bengali time to 24-hour format
  const convertBengaliTime = (bengaliTime: string): string => {
    const timeMap: { [key: string]: string } = {
      'সকাল ৮:০০': '08:00',
      'সকাল ৯:০০': '09:00',
      'সকাল ১০:০০': '10:00',
      'দুপুর ১২:০০': '12:00',
      'বিকাল ৪:০০': '16:00',
      'সন্ধ্যা ৬:০০': '18:00',
    };
    return timeMap[bengaliTime] || '10:00';
  };

  // Get service duration in minutes
  const getServiceDuration = (serviceName: string): number => {
    const durationMap: { [key: string]: number } = {
      'নিত্য পূজা': 30,
      'বিশেষ অর্চনা': 60,
      'সত্যনারায়ণ পূজা': 120,
    };
    return durationMap[serviceName] || 60;
  };

  const getStatusIcon = () => {
    switch (currentBooking?.status) {
      case 'pending':
        return <ClockIcon className="h-16 w-16 text-yellow-500 animate-spin" />;
      case 'approved':
        return <CheckCircleIcon className="h-16 w-16 text-green-500" />;
      case 'rejected':
        return <ExclamationCircleIcon className="h-16 w-16 text-red-500" />;
      default:
        return <ClockIcon className="h-16 w-16 text-gray-500" />;
    }
  };

  const getStatusMessage = () => {
    if (!currentBooking) return '';

    switch (currentBooking.status) {
      case 'pending':
        return 'আপনার বুকিং অনুরোধ পর্যালোচনা করা হচ্ছে। দয়া করে অপেক্ষা করুন...';
      case 'approved':
        return 'অভিনন্দন! আপনার বুকিং অনুমোদিত হয়েছে।';
      case 'rejected':
        return 'দুঃখিত! আপনার বুকিং বাতিল করা হয়েছে।';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (currentBooking?.status) {
      case 'pending':
        return 'from-yellow-100 to-yellow-200 border-yellow-300';
      case 'approved':
        return 'from-green-100 to-green-200 border-green-300';
      case 'rejected':
        return 'from-red-100 to-red-200 border-red-300';
      default:
        return 'from-gray-100 to-gray-200 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('bn-BD', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleClose = () => {
    stopStatusTracking();
  };

  if (!currentBooking) {
    return null;
  }

  return (
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-20 bg-black bg-opacity-60 backdrop-blur-sm">
  <div className={`bg-gradient-to-br ${getStatusColor()} border-2 rounded-2xl shadow-2xl w-full max-w-md mx-auto animate-in duration-300`}>

        {/* Header */}
        <div className="relative p-6 text-center border-b border-opacity-20 border-gray-400">          
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            বুকিং স্ট্যাটাস
          </h2>
          
          {/* Connection Status */}
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            isConnected 
              ? 'bg-green-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-1 ${
              isConnected ? 'bg-green-300' : 'bg-red-300'
            }`}></div>
            {isConnected ? 'সংযুক্ত' : 'সংযোগ বিছিন্ন'}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Status Message */}
          <div className="text-center mb-6">
            <p className="text-lg font-medium text-gray-800 mb-2">
              {getStatusMessage()}
            </p>
            
            {/* Auto-close countdown for approved bookings */}
            {currentBooking.status === 'approved' && timeRemaining && timeRemaining !== 'সময় শেষ' && (
              <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                এই পেজটি {timeRemaining} মিনিট পর বন্ধ হয়ে যাবে
              </p>
            )}

            {/* Rejection reason */}
            {currentBooking.status === 'rejected' && currentBooking.rejectionReason && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-medium text-red-800 mb-1">বাতিলের কারণ:</p>
                <p className="text-sm text-red-600">{currentBooking.rejectionReason}</p>
              </div>
            )}
          </div>

          {/* Booking Details */}
          <div className="bg-white bg-opacity-70 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-800 border-b pb-2">বুকিং বিবরণ</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">পূজার নাম:</span>
                <span className="font-medium">{currentBooking.serviceName}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">তারিখ:</span>
                <span className="font-medium">{formatDate(currentBooking.date)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">সময়:</span>
                <span className="font-medium">{currentBooking.time}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">বুকিং আইডি:</span>
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                  {currentBooking.bookingId.slice(-8)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            {currentBooking.status === 'rejected' && (
              <>
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  ঠিক আছে
                </button>
                <button
                  onClick={() => {
                    handleClose();
                    // Redirect to booking page for new booking
                    window.location.href = '/booking';
                  }}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  নতুন বুকিং
                </button>
              </>
            )}
            
            {currentBooking.status === 'approved' && (
              <div className="w-full">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                  <p className="text-sm text-green-800 text-center">
                    <strong>মনে রাখুন:</strong> নির্ধারিত সময়ের ১৫ মিনিট আগে মন্দিরে পৌঁছান
                  </p>
                </div>
                
                {timeRemaining === 'সময় শেষ' && (
                  <button
                    onClick={handleClose}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    বন্ধ করুন
                  </button>
                )}
              </div>
            )}
            
            {currentBooking.status === 'pending' && (
              <div className="w-full text-center">
                <div className="inline-flex items-center text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500 mr-2"></div>
                  অনুগ্রহ করে অপেক্ষা করুন...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingStatus;