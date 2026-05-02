

import Image from 'next/image'
import React from 'react'


type DocsProps={
    label:string,
    url:string  | undefined
}

function DocsPreview({label,url}:DocsProps) {
    const isImage = url?.match(/\.(jpg|jpeg|png|webp)(\?.*)?$/i)
    const isPdf = url?.endsWith(".pdf")
  return (
    <div className='bg-gray-50 rounded-2xl border overflow-hidden shadow-sm'>
      <div className='px-4 py-2 border-b text-sm font-semibold'>
        {label}
      </div>
      <div className='h-52 flex items-center justify-center bg-white'>
        {!url && <span className='text-xs text-gray-400'>Image non téléchargée</span>}
        
        {isImage && (
        <div className="relative w-full h-full">
         <Image
            src={url!} 
            alt={label}
            fill
            className="object-cover" 
        />
        </div>
       )}
      
        {isPdf && <iframe 
        src={url} 
        className='w-full h-full '
        title={label}/>}
        
      </div>
      {url && (
          <a href={url}
          target="_blank"
          className='block text-center text-xs py-2 font-medium hover:bg-gray-100'
          >Ouvrir les documents complets</a>
        )}
    </div>
  )
}

export default DocsPreview
