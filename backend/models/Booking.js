import React from 'react';

const Booking = () => {
  // Setmore Public Booking URL
  const SETMORE_URL = "https://kayaholisticspa.setmore.com";

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-serif text-stone-800 mb-2">
            Book Your Visit
          </h1>
          <p className="text-stone-600 max-w-lg mx-auto">
            Reserve your holistic spa treatment & schedule your appointment online.
          </p>
        </div>

        {/* Setmore Embed Frame */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-200">
          <iframe
            src={SETMORE_URL}
            title="Kaya Holistic Spa Booking"
            width="100%"
            height="800px"
            frameBorder="0"
            scrolling="yes"
            className="w-full min-h-[750px] border-none"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default Booking;