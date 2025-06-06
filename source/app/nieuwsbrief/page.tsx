'use client'

import { useState, useEffect } from 'react'
import { Grid, List, Video, ExternalLink, Calendar, User, Settings } from 'lucide-react'
import Footer from '../../components/Footer'

interface NewsletterPost {
  _id: string
  title: string
  description: string
  content?: string
  type: 'article' | 'video'
  link?: string
  videoUrl?: string
  image?: {
    filename: string
    contentType: string
    data: string
  }
  author: string
  createdAt: string
  updatedAt: string
}

type LayoutType = 'template1' | 'template2' | 'template3'

// Component for YouTube thumbnail with fallback
const YouTubeThumbnail = ({ 
  videoId, 
  alt, 
  className 
}: {
  videoId: string
  alt: string
  className?: string
}) => {
  const [showFallback, setShowFallback] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const fallbackIcon = (
    <div className={`${className} bg-red-100 flex items-center justify-center border-2 border-red-200 rounded`}>
      <div className="text-center">
        <Video className="text-red-500 mx-auto mb-1" size={20} />
        <span className="text-xs text-red-600 font-medium">YouTube</span>
      </div>
    </div>
  )

  // Try hqdefault first as it's more reliable than maxresdefault
  const thumbnailSrc = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    
    // Check if the image is likely a placeholder by checking dimensions
    // YouTube's placeholder images are typically 480x360 but appear as gray boxes
    // We can detect this by checking if the image is too small or has specific dimensions
    if (img.naturalWidth === 120 && img.naturalHeight === 90) {
      // This is likely the default placeholder
      setShowFallback(true)
    } else if (img.naturalWidth < 120 || img.naturalHeight < 90) {
      // Image too small, likely an error
      setShowFallback(true)
    } else {
      setImageLoaded(true)
    }
  }

  const handleImageError = () => {
    setShowFallback(true)
  }

  useEffect(() => {
    // Reset states when videoId changes
    setShowFallback(false)
    setImageLoaded(false)
  }, [videoId])

  if (showFallback) {
    return fallbackIcon
  }

  return (
    <div className="relative">
      <img 
        src={thumbnailSrc}
        alt={alt}
        className={`${className} ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{ transition: 'opacity 0.2s' }}
      />
      {!imageLoaded && !showFallback && (
        <div className={`${className} bg-gray-100 flex items-center justify-center animate-pulse absolute inset-0`}>
          <Video className="text-gray-400" size={16} />
        </div>
      )}
    </div>
  )
}

export default function NewsletterPage() {
  const [posts, setPosts] = useState<NewsletterPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [layout, setLayout] = useState<LayoutType>('template1')
  const [showLayoutSelector, setShowLayoutSelector] = useState(false)

  // Extract YouTube video ID from URL
  const extractYouTubeId = (url: string): string | null => {
    const regexPatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ]
    
    for (const pattern of regexPatterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  // Load layout preference from localStorage
  useEffect(() => {
    const savedLayout = localStorage.getItem('newsletter-layout') as LayoutType
    if (savedLayout) {
      setLayout(savedLayout)
    }
  }, [])

  // Save layout preference
  const changeLayout = (newLayout: LayoutType) => {
    setLayout(newLayout)
    localStorage.setItem('newsletter-layout', newLayout)
    setShowLayoutSelector(false)
  }

  // Fetch newsletter posts
  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/newsletter?sort=createdAt&order=desc')
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  // Get image URL for display with improved YouTube handling
  const getImageUrl = (post: NewsletterPost) => {
    if (post.image?.data) {
      return `data:${post.image.contentType};base64,${post.image.data}`
    }
    
    return null
  }

  // Get YouTube video ID from post
  const getYouTubeVideoId = (post: NewsletterPost): string | null => {
    if (post.type === 'video') {
      // Try videoUrl first (embed format)
      if (post.videoUrl) {
        const embedMatch = post.videoUrl.match(/embed\/([^?]+)/)
        if (embedMatch) return embedMatch[1]
      }
      
      // Try link (regular YouTube URL)
      if (post.link) {
        return extractYouTubeId(post.link)
      }
    }
    return null
  }

  // Render video component
  const renderVideo = (post: NewsletterPost) => {
    if (!post.videoUrl) return null
    
    return (
      <div className="aspect-video w-full">
        <iframe
          src={post.videoUrl}
          title={post.title}
          className="w-full h-full rounded-lg"
          allowFullScreen
        />
      </div>
    )
  }

  // Render article card with YouTube thumbnail fallback
  const renderArticleCard = (post: NewsletterPost, className = '') => {
    const imageUrl = getImageUrl(post)
    const youtubeId = getYouTubeVideoId(post)
    
    return (
      <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
        {(imageUrl || youtubeId) && (
          <div className="w-full h-48 relative">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
            ) : youtubeId ? (
              <YouTubeThumbnail
                videoId={youtubeId}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            ) : null}
          </div>
        )}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            {post.type === 'video' ? (
              <Video className="text-red-500" size={18} />
            ) : (
              <ExternalLink className="text-blue-500" size={18} />
            )}
            <span className="text-sm font-medium text-gray-500 uppercase">
              {post.type === 'video' ? 'Video' : 'Artikel'}
            </span>
          </div>
          
          <h3 className="text-xl font-bold mb-3">{post.title}</h3>
          <p className="text-gray-600 mb-4 line-clamp-3">{post.description}</p>
          
          {post.content && (
            <div className="text-gray-700 mb-4 line-clamp-4">
              {post.content}
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <User size={14} />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{new Date(post.createdAt).toLocaleDateString('nl-NL')}</span>
            </div>
          </div>
          
          {post.link && (
            <a
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-yellow-400 text-black px-4 py-2 rounded font-medium hover:bg-yellow-500 transition-colors"
            >
              Lees Meer
              <ExternalLink size={16} />
            </a>
          )}
        </div>
      </div>
    )
  }

  // Template 1: Mixed layout with sidebar
  const renderTemplate1 = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main content area */}
      <div className="lg:col-span-2 space-y-8">
        {posts.slice(0, 2).map((post) => (
          <div key={post._id}>
            {post.type === 'video' ? (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Video className="text-red-500" size={20} />
                  <h3 className="text-xl font-bold">{post.title}</h3>
                </div>
                {renderVideo(post)}
                <p className="text-gray-600 mt-4">{post.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
                  <span>{post.author}</span>
                  <span>{new Date(post.createdAt).toLocaleDateString('nl-NL')}</span>
                </div>
              </div>
            ) : (
              renderArticleCard(post)
            )}
          </div>
        ))}
      </div>
      
      {/* Sidebar - Show remaining posts */}
      <div className="space-y-6">
        {posts.slice(2).map((post) => {
          const imageUrl = getImageUrl(post)
          const youtubeId = getYouTubeVideoId(post)
          
          return (
            <div key={post._id} className="bg-white rounded-lg shadow-lg p-6">
              {(imageUrl || youtubeId) && (
                <div className="w-full h-32 mb-4">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={post.title}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ) : youtubeId ? (
                    <YouTubeThumbnail
                      videoId={youtubeId}
                      alt={post.title}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ) : null}
                </div>
              )}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {post.type === 'video' ? (
                    <Video className="text-red-500" size={16} />
                  ) : (
                    <ExternalLink className="text-blue-500" size={16} />
                  )}
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    {post.type === 'video' ? 'Video' : 'Artikel'}
                  </span>
                </div>
                <h4 className="font-bold text-base leading-tight">{post.title}</h4>
                <p className="text-sm text-gray-600 line-clamp-3">{post.description}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                  <div className="flex items-center gap-1">
                    <User size={12} />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{new Date(post.createdAt).toLocaleDateString('nl-NL')}</span>
                  </div>
                </div>
                
                <div className="mt-4">
                  {post.link ? (
                    <a
                      href={post.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-500 transition-colors w-full justify-center"
                    >
                      Lees Meer
                      <ExternalLink size={14} />
                    </a>
                  ) : (
                    <button
                      className="inline-flex items-center gap-2 bg-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium w-full justify-center cursor-not-allowed"
                      disabled
                    >
                      Geen link beschikbaar
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  // Template 2: Grid layout - show all posts
  const renderTemplate2 = () => (
    <div className="space-y-8">
      {/* Show all posts in responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {posts.map((post) => (
          <div key={post._id}>
            {renderArticleCard(post, 'h-full')}
          </div>
        ))}
      </div>
    </div>
  )

  // Template 3: Single column layout - show all posts
  const renderTemplate3 = () => (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-8">
        {posts.map((post) => {
          const imageUrl = getImageUrl(post)
          const youtubeId = getYouTubeVideoId(post)
          
          return (
            <div key={post._id}>
              {post.type === 'video' ? (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Video className="text-red-500" size={20} />
                    <h3 className="text-xl font-bold">{post.title}</h3>
                  </div>
                  {renderVideo(post)}
                  <p className="text-gray-600 mt-4">{post.description}</p>
                  {post.content && (
                    <div className="text-gray-700 mt-4">{post.content}</div>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
                    <span>{post.author}</span>
                    <span>{new Date(post.createdAt).toLocaleDateString('nl-NL')}</span>
                  </div>
                  {post.link && (
                    <div className="mt-4">
                      <a
                        href={post.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-yellow-400 text-black px-4 py-2 rounded font-medium hover:bg-yellow-500 transition-colors"
                      >
                        Bekijk op YouTube
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="md:flex">
                    {(imageUrl || youtubeId) && (
                      <div className="md:w-1/3">
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={post.title}
                            className="w-full h-48 md:h-full object-cover"
                          />
                        ) : youtubeId ? (
                          <YouTubeThumbnail
                            videoId={youtubeId}
                            alt={post.title}
                            className="w-full h-48 md:h-full object-cover"
                          />
                        ) : null}
                      </div>
                    )}
                    <div className={`p-6 ${(imageUrl || youtubeId) ? 'md:w-2/3' : 'w-full'}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <ExternalLink className="text-blue-500" size={18} />
                        <span className="text-sm font-medium text-gray-500 uppercase">Artikel</span>
                      </div>
                      
                      <h3 className="text-2xl font-bold mb-3">{post.title}</h3>
                      <p className="text-gray-600 mb-4">{post.description}</p>
                      
                      {post.content && (
                        <div className="text-gray-700 mb-4">{post.content}</div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <User size={14} />
                          <span>{post.author}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>{new Date(post.createdAt).toLocaleDateString('nl-NL')}</span>
                        </div>
                      </div>
                      
                      {post.link && (
                        <a
                          href={post.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-yellow-400 text-black px-4 py-2 rounded font-medium hover:bg-yellow-500 transition-colors"
                        >
                          Lees Meer
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Nieuwsbrief laden...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F2F2F2]">
        {/* Header */}
        <div className="w-full pt-24 md:pt-20 pb-8">
            <div className="container mx-auto px-4 flex flex-col md:flex-row justify-center items-center gap-4">
            <h1 className="text-3xl font-bold text-[#1E2A78] text-center md:text-left">
                Nieuwsbrief
            </h1>

            {/* Layout Switch Button */}
            <div className="relative left-22">
                <button
                onClick={() => setShowLayoutSelector(!showLayoutSelector)}
                className="bg-yellow-400 text-white px-3 py-1 rounded flex items-center gap-2 hover:bg-yellow-500"
                >
                Template {layout.slice(-1)}
                <Settings size={16} />
                </button>

                {showLayoutSelector && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border p-2 z-10">
                    {['template1', 'template2', 'template3'].map((tpl) => (
                    <button
                        key={tpl}
                        onClick={() => changeLayout(tpl as LayoutType)}
                        className={`block w-full text-left px-3 py-2 rounded hover:bg-gray-100 ${
                        layout === tpl ? 'bg-yellow-100' : ''
                        }`}
                    >
                        Template {tpl.slice(-1)}
                    </button>
                    ))}
                </div>
                )}
            </div>
            </div>
        </div>

        {/* Main content */}
        <div className="container mx-auto px-4 pt-4 pb-12">
            {layout === 'template1' && renderTemplate1()}
            {layout === 'template2' && renderTemplate2()}
            {layout === 'template3' && renderTemplate3()}

            {posts.length === 0 && (
            <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                Nog geen nieuwsbrief content beschikbaar.
                </p>
            </div>
            )}
        </div>
        <Footer />
    </div>
  )
}