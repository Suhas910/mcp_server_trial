import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Send, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ApiError } from '../api/client';
import { StarDisplay, StarInput } from '../components/StarRating';
import styles from './FoodDetailPage.module.css';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function FoodDetailPage() {
  const { groupId, foodId } = useParams<{ groupId: string; foodId: string }>();
  const { state, isLoading, addReview, likeReview, addComment, likeComment } = useApp();
  const navigate = useNavigate();

  const group = state.groups.find(g => g.id === groupId);
  const food = group?.foodItems.find(f => f.id === foodId);

  const [activeTab, setActiveTab] = useState<'reviews' | 'discussion'>('reviews');
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [commentText, setCommentText] = useState('');
  const [imgError, setImgError] = useState(false);
  const [actionError, setActionError] = useState('');

  if (!group || !food) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>{isLoading ? 'Loading…' : 'Item not found.'}</p>
        {!isLoading && (
          <Link to="/" className="btn btn-ghost" style={{ marginTop: 16, display: 'inline-flex' }}>Go Home</Link>
        )}
      </div>
    );
  }

  const avgRating = food.reviews.length
    ? food.reviews.reduce((a, r) => a + r.rating, 0) / food.reviews.length
    : 0;

  const userReview = food.reviews.find(r => r.memberId === state.currentUser.id);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    setActionError('');
    try {
      await addReview(group.id, food.id, rating, reviewText.trim());
      setRating(0);
      setReviewText('');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not post your review. Please try again.');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setActionError('');
    try {
      await addComment(group.id, food.id, commentText.trim());
      setCommentText('');
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not post your comment. Please try again.');
    }
  };

  const handleLikeReview = (reviewId: string) => {
    likeReview(group.id, food.id, reviewId).catch(() => setActionError('Could not update your like. Please try again.'));
  };

  const handleLikeComment = (commentId: string) => {
    likeComment(group.id, food.id, commentId).catch(() => setActionError('Could not update your like. Please try again.'));
  };

  return (
    <div className={styles.page}>
      {/* Back */}
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(`/groups/${group.id}`)}>
          <ArrowLeft size={15} />
          Back to {group.name}
        </button>
      </div>

      <div className={styles.layout}>
        {/* Left — image + info */}
        <div className={styles.left}>
          <div className={styles.imgWrapper}>
            {food.imageUrl && !imgError ? (
              <img src={food.imageUrl} alt={food.name} className={styles.img} onError={() => setImgError(true)} />
            ) : (
              <div className={styles.imgFallback}>🍽️</div>
            )}
          </div>

          <div className={styles.infoCard}>
            <div className={styles.categoryBadge}>{food.category}</div>
            <h1 className={`${styles.foodName} font-display`}>{food.name}</h1>
            {food.description && (
              <p className={styles.foodDesc}>{food.description}</p>
            )}

            <div className={styles.ratingBlock}>
              {avgRating > 0 ? (
                <>
                  <StarDisplay value={avgRating} size="lg" count={food.reviews.length} />
                  <span className={styles.ratingLabel}>Average rating</span>
                </>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>No ratings yet — be the first!</p>
              )}
            </div>

            <div className={styles.addedByRow}>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Added by</span>
              <strong style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{food.addedByName}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>· {timeAgo(food.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Right — tabs */}
        <div className={styles.right}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'reviews' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              <Star size={14} />
              Reviews ({food.reviews.length})
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'discussion' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('discussion')}
            >
              💬 Discussion ({food.comments.length})
            </button>
          </div>

          {/* ── Reviews Tab ── */}
          {activeTab === 'reviews' && (
            <div className={styles.tabContent}>
              {/* Write a review */}
              <div className={styles.writeCard}>
                <h3 className={styles.writeTitle}>
                  {userReview ? 'Your Review' : 'Write a Review'}
                </h3>
                {actionError && (
                  <p style={{ color:'var(--danger)', fontSize:13, marginBottom:8 }}>{actionError}</p>
                )}
                <form onSubmit={handleReviewSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <div>
                    <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:8 }}>Your rating</p>
                    <StarInput value={rating || userReview?.rating || 0} onChange={setRating} />
                  </div>
                  <textarea
                    className="form-input"
                    placeholder={userReview ? 'Update your review...' : 'Share your thoughts...'}
                    value={reviewText || (rating === 0 && userReview ? userReview.text : reviewText)}
                    onChange={e => setReviewText(e.target.value)}
                    rows={3}
                    defaultValue={userReview?.text}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={rating === 0}
                    style={{ opacity: rating === 0 ? 0.5 : 1, cursor: rating === 0 ? 'not-allowed' : 'pointer' }}
                  >
                    {userReview ? 'Update Review' : 'Post Review'}
                  </button>
                </form>
              </div>

              <hr className="divider" />

              {/* Review list */}
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {food.reviews.length === 0 && (
                  <p style={{ color:'var(--text-muted)', fontSize:14, textAlign:'center', padding:'24px 0' }}>
                    No reviews yet.
                  </p>
                )}
                {food.reviews.map(r => (
                  <div key={r.id} className={styles.reviewCard}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div className="avatar" style={{ background: r.memberColor + '33', border:`2px solid ${r.memberColor}44` }}>
                          {r.memberAvatar}
                        </div>
                        <div>
                          <p style={{ fontWeight:700, fontSize:14 }}>{r.memberName}</p>
                          <StarDisplay value={r.rating} size="sm" showValue={false} />
                        </div>
                      </div>
                      <span style={{ fontSize:12, color:'var(--text-muted)', whiteSpace:'nowrap' }}>{timeAgo(r.createdAt)}</span>
                    </div>
                    {r.text && <p className={styles.reviewText}>{r.text}</p>}
                    <button
                      className={styles.likeBtn}
                      onClick={() => handleLikeReview(r.id)}
                    >
                      <Heart
                        size={13}
                        fill={r.likes.includes(state.currentUser.id) ? 'var(--danger)' : 'transparent'}
                        color={r.likes.includes(state.currentUser.id) ? 'var(--danger)' : 'var(--text-muted)'}
                      />
                      <span>{r.likes.length > 0 ? r.likes.length : ''}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Discussion Tab ── */}
          {activeTab === 'discussion' && (
            <div className={styles.tabContent}>
              {/* Comments */}
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {food.comments.length === 0 && (
                  <p style={{ color:'var(--text-muted)', fontSize:14, textAlign:'center', padding:'24px 0' }}>
                    Start the conversation!
                  </p>
                )}
                {food.comments.map(c => (
                  <div key={c.id} className={styles.commentCard}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div className="avatar avatar-sm" style={{ background: c.memberColor + '33', border:`2px solid ${c.memberColor}44` }}>
                        {c.memberAvatar}
                      </div>
                      <span style={{ fontWeight:700, fontSize:13 }}>{c.memberName}</span>
                      <span style={{ fontSize:11, color:'var(--text-muted)', marginLeft:'auto' }}>{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className={styles.commentText}>{c.text}</p>
                    <button
                      className={styles.likeBtn}
                      onClick={() => handleLikeComment(c.id)}
                    >
                      <Heart
                        size={12}
                        fill={c.likes.includes(state.currentUser.id) ? 'var(--danger)' : 'transparent'}
                        color={c.likes.includes(state.currentUser.id) ? 'var(--danger)' : 'var(--text-muted)'}
                      />
                      <span>{c.likes.length > 0 ? c.likes.length : ''}</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Comment input */}
              <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
                <div className="avatar avatar-sm" style={{ background: state.currentUser.color + '33', flexShrink:0 }}>
                  {state.currentUser.avatar}
                </div>
                <input
                  className="form-input"
                  placeholder="Add to the discussion..."
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  style={{ flex:1 }}
                />
                <button
                  type="submit"
                  className="btn-icon"
                  disabled={!commentText.trim()}
                  style={{ background:'var(--accent-dim)', color:'var(--accent)', opacity: commentText.trim() ? 1 : 0.5 }}
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
