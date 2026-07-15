
'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X } from 'lucide-react'

interface TermsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TermsModal({ isOpen, onClose }: TermsModalProps) {
  const [termsContent, setTermsContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchTerms()
    }
  }, [isOpen])

  const fetchTerms = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/terms')
      if (response.ok) {
        const data = await response.json()
        setTermsContent(data.content || defaultTermsContent)
      } else {
        setTermsContent(defaultTermsContent)
      }
    } catch (error) {
      console.error('Failed to fetch terms:', error)
      setTermsContent(defaultTermsContent)
    } finally {
      setIsLoading(false)
    }
  }

  const defaultTermsContent = `
    <h2>Terms and Conditions</h2>
    
    <h3>1. Acceptance of Terms</h3>
    <p>By using the Seva Auctions platform, you agree to be bound by these Terms and Conditions.</p>
    
    <h3>2. User Accounts</h3>
    <p>You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your account credentials.</p>
    
    <h3>3. Bidding and Auctions</h3>
    <p>All bids are binding. By placing a bid, you agree to purchase the item at that price if you are the winning bidder.</p>
    
    <h3>4. Buy It Now</h3>
    <p>Buy It Now purchases are immediate and final. No refunds are provided for Buy It Now purchases.</p>
    
    <h3>5. Payment</h3>
    <p>Payment must be made immediately upon winning an auction or making a Buy It Now purchase. We use Stripe for secure payment processing.</p>
    
    <h3>6. Item Details</h3>
    <p>Items are subject to availability and redemption restrictions as specified in each listing. Contact the provider directly to redeem your purchase.</p>
    
    <h3>7. User Conduct</h3>
    <p>Users must behave respectfully and not engage in shill bidding, fraud, or any other prohibited activities.</p>
    
    <h3>8. Privacy Policy</h3>
    <p>We respect your privacy and handle your personal information in accordance with applicable laws.</p>
    
    <h3>9. Limitation of Liability</h3>
    <p>Seva Auctions is not liable for any issues with providers or items beyond the auction platform itself.</p>
    
    <h3>10. Changes to Terms</h3>
    <p>We reserve the right to modify these terms at any time. Continued use of the platform constitutes acceptance of modified terms.</p>
    
    <p><strong>Last updated:</strong> ${new Date().toLocaleDateString()}</p>
  `

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-bold text-[#524C4C]">
              Terms and Conditions
            </DialogTitle>
            <DialogDescription>
              Please read our terms and conditions carefully
            </DialogDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="seva-spinner"></div>
            </div>
          ) : (
            <div 
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: termsContent }}
            />
          )}
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} className="seva-button-primary">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
