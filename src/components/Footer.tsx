import React from 'react';
import { Heart } from 'lucide-react';
import { AddToHomescreen } from './AddToHomescreen';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="container mx-auto px-4">

        <div className="flex flex-col md:flex-row justify-between mt-6 items-center">
          <div className="md:w-1/2 mb-4 md:mb-0">
            <p className="text-sm">
              &copy; {new Date().getFullYear()} RocketFood. All rights reserved.
            </p>
          </div>
          <div className="md:w-1/2">
            <div className="flex text-sm">
            <span>Made with &nbsp;</span>
            <Heart className="h-4 w-4 text-red-500" />
            <span>&nbsp; for healthier food choices</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between mt-6">
          <div className="md:w-1/2 mb-4 md:mb-0">
            <h4 className="text-lg font-bold mb-2">Disclaimer</h4>
            <p className="text-sm">
              This app is designed only to give suggestions recommended by an AI
              service, not from a doctor, nutritionist or other professional.
            </p>
            <br/>
            <p className="text-sm">
              This web app is designed to work best for cellphone and tablet devices (and so far tested with iPhone only).
            </p>
            <AddToHomescreen className="mt-2" />
          </div>
          <div className="md:w-1/2">
            <h4 className="text-lg font-bold mb-2">
              Other apps by the same author
            </h4>
            <ul className="text-sm list-disc ml-5">
              <li>
                <a
                  href="https://rocketmoto.us/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  RocketMoto
                </a>{' '}
                - Discover new routes to explore with your motorcycle.
              </li>
              <li>
                <a
                  href="https://sitecheck.us/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  SiteCheck
                </a>{' '}
                - Track website availability status, check SSL certificates and
                more.
              </li>
              <li>
                <a
                  href="https://rocketmap.netlify.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  RocketMap
                </a>{' '}
                - Track your position against property boundaries.
              </li>
              <li>
                <a
                  href="https://eventfy.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Eventfy.com
                </a>{' '}
                - Use AI to create interactive stories with graphics and
                multi-player.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
