import React from "react";

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-4">About Is It Dog Friendly?</h1>
      <p className="text-lg mb-2">
        Is It Dog Friendly? is a community-driven platform where users can vote and share information 
        about whether places are pet-friendly. My goal is to help pet owners find welcoming locations 
        for their best friends.
      </p>
      <p className="text-md text-gray-600">
        Built by Austin Wang. Contributions and feedback are welcome!
        <br/>
        <br/>
        <a href="https://github.com/wangaustin/is-it-pet-friendly" className="text-blue-500 hover:text-blue-700">GitHub</a>
      </p>
    </div>
  );
} 