import numpy as np
from app.services.matching_service import MatchingService


class TestCosineSimilarity:
    def setup_method(self):
        self.svc = MatchingService()

    def test_identical_vectors_score_one(self):
        v = np.array([1.0, 0.0, 0.0])
        assert abs(self.svc.cosine_similarity(v, v) - 1.0) < 1e-6

    def test_orthogonal_vectors_score_zero(self):
        v1 = np.array([1.0, 0.0])
        v2 = np.array([0.0, 1.0])
        assert abs(self.svc.cosine_similarity(v1, v2)) < 1e-6

    def test_opposite_vectors_score_negative_one(self):
        v = np.array([1.0, 0.0])
        assert abs(self.svc.cosine_similarity(v, -v) + 1.0) < 1e-6

    def test_scores_sorted_descending(self):
        """Higher-similarity therapist should rank first."""
        svc = self.svc
        user_vec = np.array([1.0, 0.0, 0.0])

        high = type("T", (), {"bio_embedding": np.array([1.0, 0.0, 0.0])})()
        low  = type("T", (), {"bio_embedding": np.array([0.0, 1.0, 0.0])})()

        scored = [
            {"score": svc.cosine_similarity(t.bio_embedding, user_vec), "therapist": t}
            for t in [low, high]
        ]
        scored.sort(key=lambda x: x["score"], reverse=True)

        assert scored[0]["therapist"] is high
